<?php
/**
 * Plist Parser Class
 *
 * Usage:
 * ======
 *     $plist = Plist::from_file("~/Music/iTunes/iTunes Music Library.xml");
 *     print_r($plist->as_array());
 */


class Plist {

	public $document;
	public $plist_node;
	public $root;
	public $data = array();

	/**
	 * Factory Methods
	 *
	 ***********************************************************************/

	public static function from_file($file) {
		if (!file_exists($file)) {
			throw new Exception("Unable to open plist file.");
		}
		$plist_document = new DOMDocument();
		$plist_document->load($file);
		return self::from_dom_document($plist_document);
	}


	public static function from_dom_document(DOMDocument $plist_document) {
		$plist = new self();
		$plist->set_dom_document($plist_document);
		return $plist;
	}

	/**
	 * Instance Methods
	 *
	 ***********************************************************************/

	public function __construct() {}

	public function __toString() {
		if ($xml = $this->as_xml()) {
			return $xml;
		}
		if (!empty($this->data['Label'])) {
			return $this->data['Label'];
		}
		return NULL;
	}

	public function __get($key) {
		if (!empty($this->data[$key])) {
			return $this->data[$key];
		}
		return NULL;
	}

	public function as_xml() {
		if (is_a($this->document, "DOMDocument")) {
			return $this->document->saveXML();
		}
		return NULL;
	}

	public function as_array() {
		return (array) $this->data;
	}


	/**
	 * Helper Methods
	 *
	 ***********************************************************************/

	public static function parse_value($value_node) {
		$value_type = $value_node->nodeName;

		$transformer_name = "parse_$value_type";

		$class = get_class();

		if ( is_callable("{$class}::{$transformer_name}") ) {
			// there is a transformer function for this node type
			return call_user_func(array($class, $transformer_name), $value_node);
		}
		// if no transformer was found
		return NULL;
	}


	public static function parse_integer( $node ) {
		return $node->textContent;
	}

	public static function parse_string( $node ) {
		return $node->textContent;
	}

	public static function parse_date( $node ) {
		return $node->textContent;
	}

	public static function parse_true( $node ) {
		return true;
	}

	public static function parse_false( $node ) {
		return false;
	}

	public static function parse_dict( $dict_node ) {
		$dict = array();

		// for each child of this node
		for (
		  $node = $dict_node->firstChild;
		  $node != null;
		  $node = $node->nextSibling
		) {
			if ( $node->nodeName == "key" ) {
				$key = $node->textContent;

				$value_node = $node->nextSibling;

				// skip text nodes
				while ( $value_node->nodeType == XML_TEXT_NODE ) {
					$value_node = $value_node->nextSibling;
				}

				// recursively parse the children
				$value = self::parse_value($value_node);

				$dict[$key] = $value;
			}
		}

		return $dict;
	}

	public static function parse_array( $array_node ) {
		$array = array();

		for (
		  $node = $array_node->firstChild;
		  $node != null;
		  $node = $node->nextSibling
		) {
			if ( $node->nodeType == XML_ELEMENT_NODE ) {
				array_push($array, self::parse_value($node));
			}
		}

		return $array;
	}

} // End of class Plist
