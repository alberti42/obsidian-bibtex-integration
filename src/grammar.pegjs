{
  const accentMap = {
    '\\"A': 'Ä',
    '\\"a': 'ä',
    "\\'A": 'Á',
    "\\'a": 'á',
    '\\.A': 'Ȟ', 
    '\\.a': 'ȟ',
    '\\=A': 'Ā',
    '\\=a': 'ā',
    '\\^A': 'Â',
    '\\^a': 'â',
    '\\`A': 'À',
    '\\`a': 'à',
    '\\k A': 'Ą',
    '\\k a': 'ą',
    '\\r A': 'Å',
    '\\r a': 'å',
    '\\u A': 'Ă',
    '\\u a': 'ă',
    '\\v A': 'Ǎ',
    '\\v a': 'ǎ',
    '\\~A': 'Ã',
    '\\~a': 'ã',
    "\\'C": 'Ć',
    "\\'c": 'ć',
    '\\.C': 'Ċ',
    '\\.c': 'ċ',
    '\\^C': 'Ĉ',
    '\\^c': 'ĉ',
    '\\c C': 'Ç',
    '\\c c': 'ç',
    '\\v C': 'Č',
    '\\v c': 'č',
    '\\v D': 'Ď',
    '\\v d': 'ď',
    '\\"E': 'Ë',
    '\\"e': 'ë',
    "\\'E": 'É',
    "\\'e": 'é',
    '\\.E': 'Ė',
    '\\.e': 'ė',
    '\\=E': 'Ē',
    '\\=e': 'ē',
    '\\^E': 'Ê',
    '\\^e': 'ê',
    '\\`E': 'È',
    '\\`e': 'è',
    '\\c E': 'Ę',
    '\\c e': 'ę',
    '\\u E': 'Ĕ',
    '\\u e': 'ĕ',
    '\\v E': 'Ě',
    '\\v e': 'ě',
    '\\.G': 'Ġ',
    '\\.g': 'ġ',
    '\\^G': 'Ĝ',
    '\\^g': 'ĝ',
    '\\c G': 'Ģ',
    '\\c g': 'ģ',
    '\\u G': 'Ğ',
    '\\u g': 'ğ',
    '\\v G': 'Ǧ',
    '\\v g': 'ǧ',
    '\\^H': 'Ĥ',
    '\\^h': 'ĥ',
    '\\v H': 'Ȟ',
    '\\v h': 'ȟ',
    '\\"I': 'Ï',
    '\\"i': 'ï',
    "\\'I": 'Í',
    "\\'i": 'í',
    '\\.I': 'İ',
    '\\=I': 'Ī',
    '\\=i': 'ī',
    '\\^I': 'Î',
    '\\^i': 'î',
    '\\`I': 'Ì',
    '\\`i': 'ì',
    '\\k I': 'Į',
    '\\k i': 'į',
    '\\u I': 'Ĭ',
    '\\u i': 'ĭ',
    '\\v I': 'Ǐ',
    '\\v i': 'ǐ',
    '\\~I': 'Ĩ',
    '\\~i': 'ĩ',
    '\\^J': 'Ĵ',
    '\\^j': 'ĵ',
    '\\c K': 'Ķ',
    '\\c k': 'ķ',
    '\\v K': 'Ǩ',
    '\\v k': 'ǩ',
    "\\'L": 'Ĺ',
    "\\'l": 'ĺ',
    '\\c L': 'Ļ',
    '\\c l': 'ļ',
    '\\v L': 'Ľ',
    '\\v l': 'ľ',
    "\\'N": 'Ń',
    "\\'n": 'ń',
    '\\c N': 'Ņ',
    '\\c n': 'ņ',
    '\\v N': 'Ň',
    '\\v n': 'ň',
    '\\~N': 'Ñ',
    '\\~n': 'ñ',
    '\\"O': 'Ö',
    '\\"o': 'ö',
    "\\'O": 'Ó',
    "\\'o": 'ó',
    '\\.O': 'Ȯ',
    '\\.o': 'ȯ',
    '\\=O': 'Ō',
    '\\=o': 'ō',
    '\\^O': 'Ô',
    '\\^o': 'ô',
    '\\`O': 'Ò',
    '\\`o': 'ò',
    '\\H O': 'Ő',
    '\\H o': 'ő',
    '\\k O': 'Ǫ',
    '\\k o': 'ǫ',
    '\\u O': 'Ŏ',
    '\\u o': 'ŏ',
    '\\v O': 'Ǒ',
    '\\v o': 'ǒ',
    '\\~O': 'Õ',
    '\\~o': 'õ',
    "\\'R": 'Ŕ',
    "\\'r": 'ŕ',
    '\\c R': 'Ŗ',
    '\\c r': 'ŗ',
    '\\v R': 'Ř',
    '\\v r': 'ř',
    "\\'S": 'Ś',
    "\\'s": 'ś',
    '\\^S': 'Ŝ',
    '\\^s': 'ŝ',
    '\\c S': 'Ş',
    '\\c s': 'ş',
    '\\v S': 'Š',
    '\\v s': 'š',
    '\\c T': 'Ţ',
    '\\c t': 'ţ',
    '\\v T': 'Ť',
    '\\v t': 'ť',
    '\\"U': 'Ü',
    '\\"u': 'ü',
    "\\'U": 'Ú',
    "\\'u": 'ú',
    '\\=U': 'Ū',
    '\\=u': 'ū',
    '\\^U': 'Û',
    '\\^u': 'û',
    '\\`U': 'Ù',
    '\\`u': 'ù',
    '\\H U': 'Ű',
    '\\H u': 'ű',
    '\\k U': 'Ų',
    '\\k u': 'ų',
    '\\r U': 'Ů',
    '\\r u': 'ů',
    '\\u U': 'Ŭ',
    '\\u u': 'ŭ',
    '\\v U': 'Ǔ',
    '\\v u': 'ǔ',
    '\\~U': 'Ũ',
    '\\~u': 'ũ',
    '\\^W': 'Ŵ',
    '\\^w': 'ŵ',
    '\\"Y': 'Ÿ',
    '\\"y': 'ÿ',
    "\\'Y": 'Ý',
    "\\'y": 'ý',
    '\\=Y': 'Ȳ',
    '\\=y': 'ȳ',
    '\\^Y': 'Ŷ',
    '\\^y': 'ŷ',
    "\\'Z": 'Ź',
    "\\'z": 'ź',
    '\\.Z': 'Ż',
    '\\.z': 'ż',
    '\\v Z': 'Ž',
    '\\v z': 'ž',
    '\\aa': 'å',    // å
    '\\AA': 'Å',    // Å
    '\\ae': 'æ',    // æ
    '\\AE': 'Æ',    // Æ
    '\\DH': 'Ð',    // Ð
    '\\dh': 'ð',    // ð
    '\\dj': 'đ',    // đ
    '\\DJ': 'Đ',    // Đ
    '\\eth': 'ð',   // ð
    '\\ETH': 'Ð',   // Ð
    '\\i': 'ı',     // ı (dotless i)
    '\\l': 'ł',     // ł
    '\\L': 'Ł',     // Ł
    '\\ng': 'ŋ',    // ŋ
    '\\NG': 'Ŋ',    // Ŋ
    '\\O': 'Ø',     // Ø
    '\\o': 'ø',     // ø
    '\\oe': 'œ',    // œ
    '\\OE': 'Œ',    // Œ
    '\\ss': 'ß',    // ß
    '\\th': 'þ',    // þ
    '\\TH': 'Þ'     // Þ    
  };
  const multipleWhiteSpaces = / +/g;  
};

main
  = blocks:block* { return blocks.filter((item) => item) }
  
block
  = bibentry / empty_lines / comment_line / comment_block // / loose_line

empty_lines
  = $(empty_line+) { return null; }

bibentry
  = "@" t:$([^ {]*) empty_chars "{" empty_chars c:$[^ ,]+ empty_chars "," empty_chars f:fields "}" empty_chars {
    let authors;
    const fields = f.reduce((acc, current) => {
        if(current[0]!=="author") {
          acc[current[0]] = current[1];
        } else {
          authors = current[1];
        };
        return acc;
      }, {})
    return {
      citekey:c,
      type:t,
      authors,
      fields
    }
  }

fields
  = (@field|.., delimiter| delimiter?)

field
  = author_field / generic_field / strict_field

author_field
  = (empty_chars @key:"author" empty_chars "=" empty_chars @author_list empty_chars)

strict_field
  = (empty_chars @key:$[^= ]+ empty_chars "=" empty_chars @$[^, ]+ empty_chars)
  
generic_field
  = (empty_chars @(!"author" @key:$[^= ]+) empty_chars "=" empty_chars @value:curly_brackets empty_chars)

delimiter
  = empty_chars "," empty_chars

curly_brackets
  = ("{" @$("\\}" / "\\{" / curly_brackets / (!"}" .))* "}")

author_list
  = "{" @authors "}"

authors
  = author|.., author_sep|

author_sep
  = " "+ "and"i " "+
  
author
  = last:author_last_name first:(first_last_sep @author_first_name)? { 
    if(!first) {
      // This should not occur, but some bad bibentry misses the first name
      const name_parts = last.split(' ');
      if(name_parts.length>0) {
        // We check whether the name contains spaces and can be thus split
        first = name_parts.slice(0, -1).join(' ');
        last = name_parts[name_parts.length - 1];
      }
    }
    return {first, last};
  }

author_last_name
  = char:(curly_brackets_special / (!"}" !author_sep !first_last_sep @.))+ { return char.join(''); }

author_first_name
  = char:(curly_brackets_special / (!"}" !author_sep @.))+ { return char.join(''); }

curly_brackets_special
  = "{" @special "}"

special
  = t:$(curly_brackets_special / (!"}" .))* {
  const accented = accentMap[t.replace(multipleWhiteSpaces,' ')];
  return accented ?? t; 
}

first_last_sep
  = " "* "," " "*
  
comment_line
  = $(_* "%" loose_line) { return null; }

comment_block
  = "@comment" $([^ {]*) empty_chars curly_brackets empty_chars newline? { return null; }

loose_line
  = t:$(([^\n]* newline) ) { return null; }

not_newline
  = [^\n]+

newline
  = [\n]

empty_line
  = $(_* [\n])

empty_chars
  = $[ \n\t]*

spacer
  = $(empty_chars "," empty_chars)

_ = [ \t]
