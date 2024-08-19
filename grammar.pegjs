{

}

main
  = block*
  
block
  = bibentry / comment / $(empty_line+) / loose_line

bibentry
  = "@" type:$([^ {]*) (_* "{") empty_chars citekey:$[^ ,]+ empty_chars "," l:list { return l; }

list
  = field|.., delimiter| delimiter?

delimiter
  = empty_chars "," empty_chars

fieldf
  = $([^\n]* [\n])
  
field
  = $(([^ =]*) empty_chars "=" empty_chars "{" [^}]* "}")

comment
  = $(_* "%" loose_line)

loose_line
  = $(([^\n]* newline) )

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
