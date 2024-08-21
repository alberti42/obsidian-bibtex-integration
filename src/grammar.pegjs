{
  let count = 0;

  const MaxMatchesReachedError = options.MaxMatchesReachedError ?? Error;
  const maxMatches = options.maxMatches ?? 100;  // Define the maximum number of matches
  const parsedData = options.parsedData ?? {};
}

main
  = blocks:block* { return blocks.filter((item) => item)}
  
block
  = bibentry / empty_lines / comment / loose_line

empty_lines
  = $(empty_line+) { return null; }

bibentry
  = "@" type:$([^ {]*) empty_chars "{" empty_chars citekey:$[^ ,]+ empty_chars "," empty_chars f:fields "}" empty_chars {

    f.type = type;
    const entries = f.reduce((acc, current) => {
      acc[current[0]] = current[1];
      return acc;
    }, {});

    // If max matches reached, throw the error and capture the position
    if (count++ >= maxMatches) {
      throw new MaxMatchesReachedError("Reached max matches", location()); // Pass last location with the error
    }

    parsedData[citekey] = entries;
    
    return null;
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
