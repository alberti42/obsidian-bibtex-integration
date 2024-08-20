import Foundation

// Helper function to resolve bookmark data and print the resolved path
func resolveBookmark(from bookmarkData: Data) {
    do {
        var isStale = false
        let resolvedURL = try URL(resolvingBookmarkData: bookmarkData, options: [.withoutUI], relativeTo: nil, bookmarkDataIsStale: &isStale)
        print(resolvedURL.path)
    } catch {
        print("Error resolving bookmark: \(error)")
        exit(1)
    }
}

// Main logic
if CommandLine.argc == 3, CommandLine.arguments[1] == "-f" {
    // Handle the case where a file path is provided with the `-f` option
    let bookmarkPath = CommandLine.arguments[2]
    do {
        let bookmarkData = try Data(contentsOf: URL(fileURLWithPath: bookmarkPath))
        resolveBookmark(from: bookmarkData)
    } catch {
        print("Error reading file: \(error)")
        exit(1)
    }
} else if CommandLine.argc == 2, CommandLine.arguments[1] == "-p" {
    // Handle the case where the Base64 bookmark is passed via pipe with the `-p` option
    let inputData = FileHandle.standardInput.readDataToEndOfFile()
    
    if let bookmarkData = Data(base64Encoded: inputData) {
        resolveBookmark(from: bookmarkData)
    } else {
        print("Error: Invalid Base64 input")
        exit(1)
    }
} else {
    // Explain usage if no valid options are provided
    print("""
    Usage: bookmark_resolver -f <path_to_bookmark_file>
           or
           echo "<base64_encoded_bookmark>" | bookmark_resolver -p
    
    Options:
    -f <path_to_bookmark_file>   : Provide the path to a file containing bookmark data.
    -p                           : Accept Base64 encoded bookmark via pipe.
    
    Example 1 (with file):
      ./bookmark_resolver -f /path/to/bookmark_file
    
    Example 2 (with pipe):
      echo "Ym9va1wEAAAAAAQQMAAAAAAAAAAAAAAAAA..." | ./bookmark_resolver -p
    """)
    exit(0)
}
