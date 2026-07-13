const fs = require('fs');
const readline = require('readline');

const run = async () => {
  const filePath = 'C:/Users/DELL/.gemini/antigravity/brain/66e654b3-96d5-4730-b4a4-0b0696cb77b5/.system_generated/logs/transcript_full.jsonl';
  const fileStream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      if (obj.step_index === 443) {
        console.log(obj.content.substring(0, 2000));
        break;
      }
    } catch (e) {}
  }
};

run();
