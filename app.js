const Redis = require("redis");
const chatGptService = require("./chatGPT");

// Redis config
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
};


// Redis channel name to listen to
const CHANNEL = process.env.REDIS_CHANNEL;

// Create a client and publisher
const publisher = Redis.createClient(REDIS_CONFIG);
const client = publisher.duplicate();


// Connect to Redis
client.connect();
publisher.connect();


// Handle Redis connection errors
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

// Subscribe to the channel
client.subscribe(CHANNEL, handleChatGPTCall);

// Handle the chatGPT call
function handleChatGPTCall(msg){
  const message = JSON.parse(msg);
  const { envelope } = message;
  const { name } = envelope;
  const body = message.core.body;
  const isChatGPTCall = body?.msg?.message?.startsWith("@chatGPT")

  // Check if the message is a chatGPT call
  if (name === "SendGroupChatMessageMsg" && isChatGPTCall) {

    // Remove the /chatGPT command from the prompt
    const prompt = body.msg.message.replace("@chatGPT", "");

    // Get the response from the chatGPT API
    chatGptService
    .getResponseFromChatGPT({ prompt })
    .then((response) => {
      const newTimeStamp = +new Date();

      // Update the message timestamp
      envelope.timestamp = newTimeStamp;
      const newMsg = `🤖 ChatGPT: ${response}`;

      // Update the message body
      body.msg.message = newMsg;
      message.core.body = body;

      // Publish the new message to the channel
      publisher.publish(CHANNEL, JSON.stringify(message));
    })
    .catch((err) => {
      console.log(err);
    });
  }
}

