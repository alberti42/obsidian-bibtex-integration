{
}

main
  = blocks:block* { return blocks.filter((item) => item) }
  
block
  = bibentry / empty_lines / comment / loose_line

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
  = (empty_chars @key:$[^= ]+ empty_chars "=" empty_chars @value:curly_brackets empty_chars)

delimiter
  = empty_chars "," empty_chars

curly_brackets
  = ("{" @$("\\}" / "\\{" / curly_brackets / (!"}" .))* "}")

author_list
  = ("{" @authors "}")

authors
  = @author|.., author_sep|
  
authorr
  = $("\\}" / "\\{" / curly_brackets / (!"}" !author_sep .))+

author_sep
  = " "* "and"i " "*
  
author
  = last:author_name first:(first_last_sep @author_name)? {return [first, last];}

author_name
  = $("\\}" / "\\{" / curly_brackets / (!"}" !author_sep !first_last_sep .))+

first_last_sep
  = " "* "," " "*
  
comment
  = $(_* "%" loose_line) { return null; }

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
