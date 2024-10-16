use wasm_bindgen::prelude::*;
use pulldown_cmark::{html, Options, Parser, Event, Tag};

#[wasm_bindgen]
pub fn markdown_to_html(markdown_input: &str) -> Result<String, JsValue> {
    let options = Options::empty();

    // First pass: Check for disallowed elements (images and HTML)
    let parser = Parser::new_ext(markdown_input, options);
    for event in parser {
        match event {
            Event::Start(tag) | Event::End(tag) => {
                if let Tag::Image(_, _, _) = tag {
                    return Err(JsValue::from_str("Error: Images are not allowed."));
                }
            }
            Event::Html(_) => {
                return Err(JsValue::from_str("Error: HTML content is not allowed."));
            }
            _ => {}
        }
    }

    // Second pass: Render the Markdown to HTML
    let parser = Parser::new_ext(markdown_input, options);
    let mut html_output = String::new();
    html::push_html(&mut html_output, parser);

    Ok(html_output)
}
