{

}

main
  = block*
  
block
  = bibentry / comment / empty_lines / loose_line

empty_lines
  = $(empty_line+) { return null; }

bibentry
  = "@" type:$([^ {]*) empty_chars "{" empty_chars citekey:$[^ ,]+ empty_chars "," empty_chars f:fields {
  const entries = f.reduce((acc, current) => {
    acc[current[0]] = current[1];
    return acc;
  }, {});
  return {type, entries}; }

fields
  = (@field|.., delimiter| delimiter?)

field
  = (empty_chars @key:$[^= ]+ empty_chars "=" empty_chars @value:curly_brackets empty_chars)

delimiter
  = empty_chars "," empty_chars

curly_brackets
  = ("{" @$("\\}" / "\\{" / curly_brackets / (!"}" .))* "}")

comment
  = $(_* "%" loose_line) { return null; }

loose_line
  = t:$(([^\n]* newline) ) { return "<<" + t + ">>"; }

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
