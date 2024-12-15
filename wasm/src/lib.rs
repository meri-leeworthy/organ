use handlebars::Handlebars;
use pulldown_cmark::{html, Options, Parser};
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};
use serde_wasm_bindgen::{from_value, to_value};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;
use wasm_bindgen_test::wasm_bindgen_test;

// #[wasm_bindgen]
// extern "C" {
//     #[wasm_bindgen(js_namespace = console)]
//     fn log(s: &str); // log to JS console
// }

#[derive(Serialize, Deserialize, Debug)]
struct UnparsedContentData {
    content: String,
    data: String,
}

#[derive(Deserialize, Debug)]
struct ContentData {
    content: String,
    data: Map<String, Value>,
}

// Alias for the expected record type
type UnparsedContentRecord = HashMap<String, UnparsedContentData>;
type ContentRecord = HashMap<String, ContentData>;

// Should return a string of rendered HTML for the current filename
#[wasm_bindgen]
pub fn render(
    current_filename: &str,
    context: &JsValue, // validated as a HashMap of files {filename: {content: string (markdown), data: string (JSON)}}
    css: &str,         // fixed parameter to the template
    class: &str,       // class name to scope the CSS
    partials: &JsValue, // Assume partials are passed as a JS object with partial names and content
    // todo: maybe partials, css and images are all included in context object
    images: &JsValue, // JS object with image filenames and URLs
) -> Result<String, JsValue> {
    // Validate context as a Record<string, {content: string, data: string}>
    let context = validate_content_record(context).and_then(parse_context)?;

    // Get the current file from the context
    let current_file = context
        .get(current_filename)
        .ok_or_else(|| JsValue::from_str("Current file not found in context"))?;

    // Get the template filename from the current file
    let template_name = match current_file.data.get("template").unwrap().clone() {
        Value::String(s) => s,
        _ => return Err(JsValue::from_str("Template property not found")),
    };

    // Get the template content from the context
    let template = context
        .get(&template_name)
        .ok_or_else(|| JsValue::from_str("Template not found in context"))?
        .content
        .clone();

    // Render Markdown to HTML
    let html_output = match markdown_to_html(&current_file.content, images) {
        Ok(output) => output,
        Err(e) => return Err(e),
    };

    // Process the CSS to scope it to the class_name
    let scoped_css = match scope_css(css, class) {
        Ok(output) => output,
        Err(e) => return Err(JsValue::from_str(&e)),
    };

    let render_context = json!({
        "content": html_output,
        "css": scoped_css,
        "class_name": class.trim_start_matches('.'),
    });

    // Render the template with the context
    let rendered_template = match render_template(&template, partials, &render_context) {
        Ok(output) => output,
        Err(e) => return Err(JsValue::from_str(&e)),
    };

    Ok(rendered_template)
}

fn render_template(
    template_content: &str,
    partials: &JsValue,
    render_context: &Value,
) -> Result<String, String> {
    let mut handlebars = Handlebars::new();

    // Deserialize the partials JsValue into a serde_json::Map<String, Value>
    let partials_map: serde_json::Map<String, Value> = match from_value(partials.clone()) {
        Ok(Value::Object(map)) => map,
        Ok(_) => return Err("Partials should be a JSON object".to_string()),
        Err(e) => return Err(format!("Failed to deserialize partials: {}", e)),
    };

    for (name, value) in partials_map.iter() {
        if let Some(template) = value.as_str() {
            handlebars
                .register_partial(name, template)
                .map_err(|e| format!("Failed to register partial {}: {}", name, e))?;
        } else {
            return Err(format!("Partial {} is not a string", name));
        }
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

fn scope_css(css_input: &str, class_name: &str) -> Result<String, String> {
    // Create a regular expression to match CSS selectors
    let selector_regex = Regex::new(r"([^\{\}]+)\{").map_err(|e| format!("Regex error: {}", e))?;

    // Use the regex to prefix selectors with the class name
    let result = selector_regex.replace_all(css_input, |caps: &regex::Captures| {
        let selectors = caps[1].trim();
        let scoped_selectors = selectors
            .split(',')
            .map(|s| format!("{} {}", class_name, s.trim()))
            .collect::<Vec<_>>()
            .join(", ");
        format!(" {} {{", scoped_selectors)
    });

    Ok(result.to_string())
}

fn markdown_to_html(markdown_input: &str, images: &JsValue) -> Result<String, JsValue> {
    let options = Options::empty();

    // Deserialize `images` using `serde-wasm-bindgen`
    let image_map: HashMap<String, String> = from_value(images.clone())
        .map_err(|e| JsValue::from_str(&format!("Failed to deserialize images: {}", e)))?;

    // Render the Markdown to HTML
    let parser = Parser::new_ext(markdown_input, options);
    let mut html_output = String::new();
    html::push_html(&mut html_output, parser);

    // Replace image `src` attributes with the provided URLs
    for (name, url) in image_map.iter() {
        html_output =
            html_output.replace(&format!("src=\"{}\"", name), &format!("src=\"{}\"", url));
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
    Ok(ContentData {
        content: file.content.clone(),
        data,
    })
}

fn parse_context(
    context: UnparsedContentRecord,
) -> Result<ContentRecord, serde_wasm_bindgen::Error> {
    context
        .into_iter()
        .map(|(filename, file)| {
            parse_file(&file)
                .map(|parsed_file| (filename.clone(), parsed_file))
                .map_err(|e| {
                    serde_wasm_bindgen::Error::new(&format!(
                        "Failed to parse file {}: {}\nFile content: {:?}",
                        filename, e, file
                    ))
                })
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);

    #[wasm_bindgen_test]
    fn test_scope_css() {
        let css = "body { color: black; } .header { font-size: 20px; }";
        let class_name = ".scoped";
        let expected = " .scoped body { color: black; } .scoped .header { font-size: 20px; }";
        let result = scope_css(css, class_name).unwrap();
        assert_eq!(result, expected);
    }

    #[wasm_bindgen_test]
    fn test_markdown_to_html() {
        let markdown = "# Hello World\nThis is a test.";
        let images = serde_wasm_bindgen::to_value(&json!({})).unwrap();
        let expected = "<h1>Hello World</h1>\n<p>This is a test.</p>\n";
        let result = markdown_to_html(markdown, &images).unwrap();
        print!("{}", result);
        assert_eq!(result, expected);
    }

    #[wasm_bindgen_test]
    fn test_validate_content_record() {
        // Construct the valid test data using Rust data structures
        let mut valid_map = HashMap::new();
        valid_map.insert(
            "file1.md".to_string(),
            UnparsedContentData {
                content: "# Hello".to_string(),
                data: "{\"template\": \"template1\"}".to_string(),
            },
        );
        let valid_context = to_value(&valid_map).unwrap();
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
        let invalid_context = to_value(&invalid_map).unwrap();
        let result = validate_content_record(&invalid_context);
        assert!(result.is_err());
    }

    #[wasm_bindgen_test]
    fn test_parse_file() {
        let unparsed_content = UnparsedContentData {
            content: "# Hello".to_string(),
            data: "{\"template\": \"template1\"}".to_string(),
        };
        let result = parse_file(&unparsed_content);
        assert!(result.is_ok());
        let parsed_content = result.unwrap();
        assert_eq!(parsed_content.content, "# Hello");
        assert_eq!(parsed_content.data.get("template").unwrap(), "template1");
    }

    #[wasm_bindgen_test]
    fn test_parse_context() {
        let unparsed_context = HashMap::from([(
            "file1.md".to_string(),
            UnparsedContentData {
                content: "# Hello".to_string(),
                data: "{\"template\": \"template1\"}".to_string(),
            },
        )]);
        let result = parse_context(unparsed_context);
        assert!(result.is_ok());
        let parsed_context = result.unwrap();
        assert!(parsed_context.contains_key("file1.md"));
    }

    #[wasm_bindgen_test]
    fn test_render_template() {
        let template_content = "Hello, {{name}}!";
        let partials = serde_wasm_bindgen::to_value(&json!({})).unwrap();
        let context = json!({ "name": "World" });
        let result = render_template(template_content, &partials, &context);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "Hello, World!");
    }
}
