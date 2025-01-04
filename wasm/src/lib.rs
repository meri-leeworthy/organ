#![allow(unused)]

use handlebars::Handlebars;
use pulldown_cmark::{html, Options, Parser};
use serde::de::Error as SerdeError;
use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};
use serde_wasm_bindgen::{from_value, to_value};
use std::collections::HashMap;
use std::convert::TryInto;
use std::fmt::{self, Display, Formatter};
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;
use wasm_bindgen_test::wasm_bindgen_test;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str); // log to JS console
}

#[derive(Serialize, Deserialize, Debug, Clone)]
enum Collection {
    Asset,
    Template,
    Page,
    Style,
    Partial,
}

impl Display for Collection {
    fn fmt(&self, f: &mut Formatter) -> fmt::Result {
        match self {
            Collection::Asset => write!(f, "asset"),
            Collection::Template => write!(f, "template"),
            Collection::Page => write!(f, "page"),
            Collection::Style => write!(f, "style"),
            Collection::Partial => write!(f, "partial"),
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
struct UnparsedContentData {
    name: String,
    content: String,
    file_type: String,
    data: String,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
struct ContentData {
    name: String,
    content: String,
    file_type: Collection,
    data: Map<String, Value>,
}

// Alias for the expected record type
// note that the key is serialised as a string, but it functions as primary key id
// and is interpreted as an integer in the JS context
type UnparsedContentRecord = HashMap<String, UnparsedContentData>;

#[derive(Serialize, Deserialize, Debug)]
struct ContentRecord {
    content: HashMap<String, ContentData>,
}

impl ContentRecord {
    fn new() -> Self {
        ContentRecord {
            content: HashMap::new(),
        }
    }

    fn new_with_content(content: HashMap<String, ContentData>) -> Self {
        ContentRecord { content }
    }

    fn iter(&self) -> impl Iterator<Item = (&String, &ContentData)> {
        self.content.iter()
    }

    fn get(&self, key: &String) -> Option<&ContentData> {
        self.content.get(key)
    }
}

// Should return a string of rendered HTML for the current filename
#[wasm_bindgen]
pub fn render(current_file_id: i32, context: &JsValue) -> Result<String, JsValue> {
    // log(&format!("Context: {:?}", context));

    // Now, current_file_id is already an i32, no need for manual conversion
    // Validate context as a Record<string, {content: string, data: string}>
    let context = validate_content_record(context).map_err(|e| e.to_string())?;
    let context = parse_context(context);

    let current_file = context
        .get(&current_file_id.to_string())
        .ok_or_else(|| JsValue::from_str("Current file not found in context"))?;

    // log(&format!("Current file: {:?}", current_file.data));

    // Get the template filename from the current file data
    let template_id = match current_file
        .data
        .get("template")
        .expect("'Template' not found in associated data for current file")
        .clone()
    {
        Value::Number(n) => n.to_string(),
        Value::String(s) => s,
        _ => return Err(JsValue::from_str("Template property not found")),
    };

    // Get the template content from the context
    let template = context
        .get(&template_id)
        .ok_or_else(|| JsValue::from_str("Template not found in context"))?
        .content
        .clone();

    // get images from context
    let images: ContentRecord = ContentRecord::new_with_content(
        context
            .iter()
            .filter(|(_, v)| matches!(v.file_type, Collection::Asset))
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect(),
    );

    // get partials from context
    let partials: ContentRecord = ContentRecord::new_with_content(
        context
            .iter()
            .filter(|(_, v)| matches!(v.file_type, Collection::Partial))
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect(),
    );

    // Render Markdown to HTML
    let html_output = match markdown_to_html(&current_file.content, &images) {
        Ok(output) => output,
        Err(e) => return Err(e.into()),
    };

    fn name_with_extension(name: String, file_type: &Collection) -> String {
        match file_type {
            Collection::Style => return name + "-css",
            _ => {
                log("Files in context should only be Style");
                panic!("Files in context should only be Style")
            }
        }
    }

    // create ContentRecord with all the style files
    let css: HashMap<String, String> = context
        .iter()
        .filter(|(_, v)| matches!(v.file_type, Collection::Style))
        .map(|(_k, v)| {
            (
                name_with_extension(v.clone().name, &v.file_type),
                v.clone().content,
            )
        })
        .collect();

    // convert ContentRecord to JSON and add "content" key with "html_output" as value
    let mut render_context: Value =
        serde_wasm_bindgen::from_value(to_value(&css).expect("CSS Value Conversion failed"))
            .expect("CSS JSON Conversion failed");
    render_context["content"] = json!(html_output);

    for (key, value) in &current_file.data {
        render_context[key] = value.clone();
    }

    log(format!("Current file data: {:?}", current_file.data).as_str());
    log(format!("Render context: {:?}", render_context).as_str());

    // Render the template with the context
    let rendered_template = match render_template(&template, &partials, &render_context) {
        Ok(output) => output,
        Err(e) => return Err(JsValue::from_str(&e)),
    };

    Ok(rendered_template)
}

fn render_template(
    template_content: &str,
    partials: &ContentRecord,
    render_context: &Value,
) -> Result<String, String> {
    let mut handlebars = Handlebars::new();

    // Register the partials
    for (id, value) in partials.iter() {
        handlebars
            .register_partial(id, value.content.as_str())
            .map_err(|e| format!("Failed to register partial {}: {}", id, e))?;
    }

    // Register the template from the string
    if let Err(e) = handlebars.register_template_string("template", template_content) {
        return Err(format!("Template error: {}", e));
    }

    // Render the template
    match handlebars.render("template", render_context) {
        Ok(output) => Ok(output),
        Err(e) => Err(format!("Rendering error: {}", e)),
    }
}

fn markdown_to_html(markdown_input: &str, images: &ContentRecord) -> Result<String, String> {
    let options = Options::empty();

    // Render the Markdown to HTML
    let parser = Parser::new_ext(markdown_input, options);
    let mut html_output = String::new();
    html::push_html(&mut html_output, parser);

    // Replace image `src` attributes with the provided URLs
    for (_id, file) in images.iter() {
        html_output = html_output.replace(
            &format!("src=\"{}\"", file.name),
            &format!("src=\"{}\"", file.content),
        );
    }

    Ok(html_output)
}

fn validate_content_record(
    value: &JsValue,
) -> Result<UnparsedContentRecord, serde_wasm_bindgen::Error> {
    serde_wasm_bindgen::from_value(value.clone())
}

fn parse_file(file: &UnparsedContentData) -> Result<ContentData, serde_json::Error> {
    let data = serde_json::from_str(&file.data)?;
    let file_type = match file.file_type.as_str() {
        "asset" => Collection::Asset,
        "template" => Collection::Template,
        "page" => Collection::Page,
        "style" => Collection::Style,
        "partial" => Collection::Partial,
        _ => return Err(serde_json::Error::custom("Invalid file type")),
    };
    Ok(ContentData {
        name: file.name.clone(),
        content: file.content.clone(),
        file_type,
        data,
    })
}

fn parse_context(context: UnparsedContentRecord) -> ContentRecord {
    let parsed_content: HashMap<String, ContentData> = context
        .into_iter()
        .map(|(filename, file)| {
            parse_file(&file).map(|parsed_file| (filename.clone(), parsed_file))
        })
        .collect::<Result<_, _>>()
        .map_err(|e| serde_wasm_bindgen::Error::new(&format!("Failed to parse context: {}", e)))
        .expect("Failed to parse context");

    ContentRecord::new_with_content(parsed_content)
}

#[cfg(test)]
mod tests {
    use super::*;
    wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);

    #[wasm_bindgen_test]
    fn test_markdown_to_html() {
        let markdown = "# Hello World\nThis is a test.";
        let images: ContentRecord = ContentRecord::new();
        let expected = "<h1>Hello World</h1>\n<p>This is a test.</p>\n";
        let result = markdown_to_html(markdown, &images).expect("Markdown to html failed");
        print!("{}", result);
        assert_eq!(result, expected);
    }

    #[wasm_bindgen_test]
    fn test_validate_content_record() {
        // Construct the valid test data using Rust data structures
        let mut valid_map = HashMap::new();
        valid_map.insert(
            "9".to_string(),
            UnparsedContentData {
                name: "file1".to_string(),
                content: "# Hello".to_string(),
                file_type: "page".to_string(),
                data: "{\"template\": \"template1\"}".to_string(),
            },
        );
        let valid_context =
            to_value(&valid_map).expect("Content record to Value conversion failed");
        let result = validate_content_record(&valid_context);
        match result {
            Ok(_) => assert!(true),
            Err(e) => panic!("Validation failed: {:?}", e),
        }

        // Construct the invalid test data to trigger a deserialization error
        let mut invalid_map = HashMap::new();
        invalid_map.insert(
            "file1.md".to_string(),
            serde_json::json!({
                "content": "# Hello",
                "data": 123  // Invalid type for 'data', should be a string
            }),
        );
        let invalid_context = to_value(&invalid_map).expect("Invalid map to Value conv failed");
        let result = validate_content_record(&invalid_context);
        assert!(result.is_err());
    }

    #[wasm_bindgen_test]
    fn test_parse_file() {
        let unparsed_content = UnparsedContentData {
            name: "file1".to_string(),
            content: "# Hello".to_string(),
            file_type: "page".to_string(),
            data: "{\"template\": \"template1\"}".to_string(),
        };
        let result = parse_file(&unparsed_content);
        assert!(result.is_ok());
        let parsed_content = result.expect("Parsing content failed");
        assert_eq!(parsed_content.content, "# Hello");
        assert_eq!(
            parsed_content
                .data
                .get("template")
                .expect("'template' not found in parsed content"),
            "template1"
        );
    }

    #[wasm_bindgen_test]
    fn test_parse_context() {
        let unparsed_context = HashMap::from([(
            "1".to_string(),
            UnparsedContentData {
                name: "file1".to_string(),
                content: "# Hello".to_string(),
                file_type: "page".to_string(),
                data: "{\"template\": \"template1\"}".to_string(),
            },
        )]);
        let result = parse_context(unparsed_context);
        let parsed_context = result;
        assert!(parsed_context.content.contains_key(&"1".to_string()));
    }

    #[wasm_bindgen_test]
    fn test_render_template() {
        let template_content = "Hello, {{name}}!";
        let partials = ContentRecord::new();
        let context = json!({ "name": "World" });
        let result = render_template(template_content, &partials, &context);
        assert!(result.is_ok());
        assert_eq!(result.expect("Render template failed"), "Hello, World!");
    }
}
