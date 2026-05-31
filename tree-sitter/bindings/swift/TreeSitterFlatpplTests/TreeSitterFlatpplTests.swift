import XCTest
import SwiftTreeSitter
import TreeSitterFlatppl

final class TreeSitterFlatpplTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_flatppl())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Flatppl grammar")
    }
}
