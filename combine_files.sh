#!/bin/bash

# Output file name
output_file="combined_output.txt"

# Clear the output file if it exists
> "$output_file"

# Loop through each file provided as an argument
for file in "$@"; do
  if [[ -f "$file" ]]; then
    echo "File: $file" >> "$output_file"
    echo "\`\`\`" >> "$output_file"
    cat "$file" >> "$output_file"
    echo "\`\`\`" >> "$output_file"
    echo "" >> "$output_file" # Add a newline for separation
  else
    echo "Warning: $file is not a regular file or does not exist. Skipping."
  fi
done

echo "Contents copied to $output_file"