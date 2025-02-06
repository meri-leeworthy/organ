import type { FileData } from "./types"

export function updateImageUrls(
  data: FileData["data"],
  replacer: (id: number) => string
) {
  if (
    typeof data === "object" &&
    data !== null &&
    "body" in data &&
    typeof data.body === "object" &&
    data.body !== null &&
    "type" in data.body &&
    data.body.type === "html" &&
    "content" in data.body &&
    typeof data.body.content === "string"
  ) {
    const htmlContent: string = data.body.content

    // the original images are identified in the html title attribute
    const originalImages = htmlContent?.match(/<img[^>]*title="(\d+)"[^>]*>/g)
    console.log("Original Images:", originalImages)

    const idBlobMap = new Map(
      originalImages?.map((img: string) => {
        const id = img.match(/title="(\d+)"/)?.[1]
        const url = img.match(/src="([^"]+)"/)?.[1]
        return [id, url]
      })
    )

    console.log("Id Blob Map:", idBlobMap)

    const newHtmlContent = htmlContent?.replace(
      /<img[^>]*title="(\d+)"[^>]*>/g,
      (match: string, title: string) => {
        console.log("Match:", match)
        console.log("title:", title)
        const refreshedUrl = replacer(parseInt(title))
        return `<img src="${refreshedUrl}" title="${title}" />`
      }
    )
    return {
      ...data,
      body: {
        ...data.body,
        content: newHtmlContent,
      },
    }
  }
  return data
}
