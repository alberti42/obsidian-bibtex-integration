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
    return {
      citekey:c,
      type:t,
      authors:[],
      fields:f.reduce((acc, current) => {
        acc[current[0]] = current[1];
        return acc;
      }, {})
    }
  }

fields
  = (@field|.., delimiter| delimiter?)

field
  = generic_field / strict_field
  
strict_field
  = (empty_chars @key:$[^= ]+ empty_chars "=" empty_chars @$[^, ]+ empty_chars)
  
generic_field
  = (empty_chars @key:$[^= ]+ empty_chars "=" empty_chars @value:curly_brackets empty_chars)

delimiter
  = empty_chars "," empty_chars

curly_brackets
  = ("{" @$("\\}" / "\\{" / curly_brackets / (!"}" .))* "}")

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
