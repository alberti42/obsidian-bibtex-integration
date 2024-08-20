import { parse } from "./peggy.mjs";

self.onmessage = function(event) {
  const data = event.data;
  
  // Perform the parsing (this runs in the worker thread)
  const result = parse(data);

  // Send the result back to the main thread
  self.postMessage(result);
};
