/**
 * Load an image and return Promise
 *
 * @param url
 * @param remove
 */
export const loadImage = (url: string, remove: boolean = true): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        if (!document) reject()
        let img = document.createElement('img')
        img.onload = function() {
            if (remove) img.remove()
            resolve(img)
        }
        img.onerror = function(e) {
            img.remove()
            reject(img)
        }
        img.onabort = function (e) {
            img.remove()
            reject(img)
        }
        img.src = url
    })
}
