use std::collections::HashMap;

use handlebars::Handlebars;
use pulldown_cmark::{html, Options, Parser};
use regex::Regex;
use serde_json::Value;
use serde_wasm_bindgen::from_value;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn render(
    template_content: &str,
    markdown_input: &str,
    css_input: &str,
    class_name: &str,
    partials: &JsValue, // Assume partials are passed as a JS object with partial names and content
    images: &JsValue,   // JS object with image filenames and URLs
) -> Result<String, JsValue> {
    // Step 1: Split Markdown into frontmatter and content
    let (frontmatter_str, markdown_content) = match split_frontmatter(markdown_input) {
        Ok(result) => result,
        Err(e) => return Err(JsValue::from_str(&e)),
    };

    // Step 2: Deserialize frontmatter into serde_json::Value
    let mut context = match deserialize_frontmatter(&frontmatter_str) {
        Ok(val) => val,
        Err(e) => return Err(JsValue::from_str(&e)),
    };

    // Step 3: Render Markdown to HTML
    let html_output = match markdown_to_html(&markdown_content, images) {
        Ok(output) => output,
        Err(e) => return Err(e),
    };

    // Step 4: Insert HTML into context as 'content'
    context["content"] = Value::String(html_output);

    // Step 5: Process the CSS to scope it to the class_name
    let scoped_css = match scope_css(css_input, class_name) {
        Ok(output) => output,
        Err(e) => return Err(JsValue::from_str(&e)),
    };

    // Insert scoped CSS and class name into context
    context["css"] = Value::String(scoped_css);
    context["class_name"] = Value::String(class_name.trim_start_matches('.').to_string());

    // Step 6: Render the template with the context
    let rendered_template = match render_template(template_content, partials, &context) {
        Ok(output) => output,
        Err(e) => return Err(JsValue::from_str(&e)),
    };

    Ok(rendered_template)
}

fn render_template(
    template_content: &str,
    partials: &JsValue,
    context: &Value,
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
    match handlebars.render("template", context) {
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
        format!("{} {{", scoped_selectors)
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

/// Splits the markdown input into frontmatter and content.
/// Assumes frontmatter is enclosed between '---' lines at the beginning.
fn split_frontmatter(markdown: &str) -> Result<(String, String), String> {
    let lines: Vec<&str> = markdown.lines().collect();
    if lines.len() < 2 || !lines[0].trim_start().starts_with("---") {
        return Err("Missing or invalid YAML frontmatter.".into());
    }

    // Find the closing '---'
    let closing_index = lines[1..]
        .iter()
        .position(|line| line.trim_start().starts_with("---"))
        .map(|idx| idx + 1)
        .ok_or_else(|| "YAML frontmatter not closed with '---'.".to_string())?;

    let frontmatter = lines[1..closing_index].join("\n");
    let content = lines[closing_index + 1..].join("\n");

    Ok((frontmatter, content))
}

/// Deserializes YAML frontmatter into serde_json::Value
fn deserialize_frontmatter(frontmatter: &str) -> Result<Value, String> {
    let yaml_value: serde_yaml::Value =
        serde_yaml::from_str(frontmatter).map_err(|e| format!("YAML parse error: {}", e))?;

    // Convert serde_yaml::Value to serde_json::Value
    let json_value = serde_json::to_value(yaml_value)
        .map_err(|e| format!("Conversion to JSON Value error: {}", e))?;

    // Ensure it's a JSON object
    if !json_value.is_object() {
        return Err("Frontmatter must be a YAML object.".into());
    }

    Ok(json_value)
}
