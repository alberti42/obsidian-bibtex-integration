import Foundation

if CommandLine.argc < 2 {
    print("Usage: bookmark_resolver <path_to_bookmark>")
    exit(1)
}

let bookmarkPath = CommandLine.arguments[1]

do {
    let bookmarkData = try Data(contentsOf: URL(fileURLWithPath: bookmarkPath))
    var isStale = false
    let resolvedURL = try URL(resolvingBookmarkData: bookmarkData, options: [.withoutUI], relativeTo: nil, bookmarkDataIsStale: &isStale)
    
    print(resolvedURL.path)
} catch {
    print("Error resolving bookmark: \(error)")
    exit(1)
}
