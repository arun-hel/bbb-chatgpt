const Redis = require("redis");
const chatGptService = require("./chatGPT");

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
};

const CHANNEL = process.env.REDIS_CHANNEL;
const publisher = Redis.createClient(REDIS_CONFIG);
const client = publisher.duplicate();

client.connect();
publisher.connect();


client.on("connect", () => {
  console.log("Client Connected to Redis");
});

client.on("error", (err) => {
  console.log("Client Error " + err);
});

publisher.on("connect", () => {
  console.log("Publisher Connected to Redis");
});

publisher.on("error", (err) => {
  console.log("Publisher Error " + err);
});

client.subscribe(CHANNEL, handleChatGPTCall);


function handleChatGPTCall(msg){
  const message = JSON.parse(msg);
  const { envelope } = message;
  const { name } = envelope;
  const body = message.core.body;
  const isChatGPTCall = body?.msg?.message?.startsWith("/chatGPT")

  if (name === "SendGroupChatMessageMsg" && isChatGPTCall) {
    const prompt = body.msg.message.replace("/chatGPT", "");
    chatGptService
    .getResponseFromChatGPT({ prompt })
    .then((response) => {
      const newTimeStamp = +new Date();
      envelope.timestamp = newTimeStamp;
      const newMsg = `
        Prompt: ${prompt}
        Answer: ${response}

        `;
      body.msg.message = newMsg;
      message.core.body = body;
      publisher.publish(CHANNEL, JSON.stringify(message));
    })
    .catch((err) => {
      console.log(err);
    });
  }
}

