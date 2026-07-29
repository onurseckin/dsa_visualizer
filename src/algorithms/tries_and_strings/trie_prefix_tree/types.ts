export interface TriePrefixTreeInput {
  wordsToInsert: string[];
  searchWord: string;
  prefixToSearch: string;
}

export const TRIE_PREFIX_TREE_CODE = `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end_of_word = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end_of_word = True

    def search(self, word: str) -> bool:
        node = self.root
        for char in word:
            if char not in node.children:
                return False
            node = node.children[char]
        return node.is_end_of_word

    def startsWith(self, prefix: str) -> bool:
        node = self.root
        for char in prefix:
            if char not in node.children:
                return False
            node = node.children[char]
        return True`;

export const DEFAULT_TRIE_INPUT: TriePrefixTreeInput = {
  wordsToInsert: ["cat", "car", "dog"],
  searchWord: "car",
  prefixToSearch: "ca",
};

export interface InternalTrieNode {
  id: string;
  char: string;
  isEndOfWord: boolean;
  children: Map<string, InternalTrieNode>;
}
