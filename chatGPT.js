const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config()
const chatGPT = axios.create({
    baseURL: process.env.CHAT_GPT_BASE_URL,
    headers: {
        "Authorization": `Bearer ${process.env.CHAT_GPT_API_TOKEN}`,
        "Content-Type": "application/json"
    }
})

async function getResponseFromChatGPT({ prompt }) {
    try {
        const { data } = await chatGPT.post('/v1/completions', {
            model: "text-davinci-003",
            // append the stop sequence to the prompt so the API knows when to stop generating text.
            prompt: `${prompt.trim()} ${process.env.CHAT_GPT_STOP_SEQUENCE}}`,
            temperature: 0,
            max_tokens: 1000,
            stop: [process.env.CHAT_GPT_STOP_SEQUENCE],
        });
        return data.choices[0].text.trim()
    } catch (error) {
        const err = error.response ? error.response.data : error.message;
        console.error(err);
        throw error;
    }
}

module.exports = {
    getResponseFromChatGPT
}
