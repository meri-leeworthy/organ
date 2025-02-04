use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::collections::HashMap;
use std::fmt::{self, Display, Formatter};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum Collection {
    Asset,
    Template,
    Page,
    TemplateAsset,
    Partial,
}

impl Display for Collection {
    fn fmt(&self, f: &mut Formatter) -> fmt::Result {
        match self {
            Collection::Asset => write!(f, "asset"),
            Collection::Template => write!(f, "template"),
            Collection::Page => write!(f, "page"),
            Collection::TemplateAsset => write!(f, "templateAsset"),
            Collection::Partial => write!(f, "partial"),
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UnparsedContentData {
    pub name: String,
    pub file_type: String,
    pub data: String,
    pub url: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ContentData {
    pub name: String,
    pub file_type: Collection,
    pub data: Map<String, Value>,
    pub url: String,
}

// Alias for the expected record type
// note that the key is serialised as a string, but it functions as primary key id
// and is interpreted as an integer in the JS context
pub type UnparsedContentRecord = HashMap<String, UnparsedContentData>;

#[derive(Serialize, Deserialize, Debug)]
pub struct ContentRecord {
    pub content: HashMap<String, ContentData>,
}

impl ContentRecord {
    pub fn new() -> Self {
        ContentRecord {
            content: HashMap::new(),
        }
    }

    pub fn new_with_content(content: HashMap<String, ContentData>) -> Self {
        ContentRecord { content }
    }

    pub fn iter(&self) -> impl Iterator<Item = (&String, &ContentData)> {
        self.content.iter()
    }

    pub fn get(&self, key: &String) -> Option<&ContentData> {
        self.content.get(key)
    }
}
