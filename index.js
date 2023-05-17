require('dotenv').config();
const dataJson = require('./moods.json');
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, InteractionResponse, MessageEmbed    } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  organization:"org-3qgRCPAZSU5qxHftWB8oGtfl",
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Mood options
const sendMoodOptions = async (channel) => {

  const happyButton = new ButtonBuilder()
    .setStyle('Primary')
    .setLabel('Happy')
    .setCustomId('happy');

  const sadButton = new ButtonBuilder()
    .setStyle('Danger')
    .setLabel('Sad')
    .setCustomId('sad');

  const excitedButton = new ButtonBuilder()
    .setStyle('Success')
    .setLabel('Excited')
    .setCustomId('excited');

  const boredButton = new ButtonBuilder()
    .setStyle('Secondary')
    .setLabel('Bored')
    .setCustomId('bored');

  const tiredButton = new ButtonBuilder()
    .setStyle('Primary')
    .setLabel('Tired')
    .setCustomId('tired');

  //  Send the mood options
  const row = new ActionRowBuilder()
    .addComponents(happyButton, sadButton, excitedButton, boredButton, tiredButton);

  channel.send({ content: 'How are you feeling today?', components: [row] });

};

message = [
  { role: "system", content: `I want you to act as a motivator. Your response should be something that motivates or cheers me up. It can be of maximum two sentences, where one sentence should make me feel good and other can be a motivational quote, some suggestion for an activity, or another sentence that makes me feel good. In the same response, you also have to generate a prompt that I can use as an input for a text-to-image generation model. The prompt should be as precise as possible but it should be unique and don't write instruction to add text on the image. Most importantly, it should be matching with my mood. Don't write extremely detailed prompts and keep it simple. The format of the prompt should be as below: "Prompt: This is an example prompt. Now there are more details regarding the prompt. May be a little more".`},
]

// Handle the interaction
const handleInteraction = async (interaction) => {
  if (!interaction.isButton()) return;
  const mood = interaction.customId;
  console.log(`Mood selected: ${mood}`);

  let random_int = Math.floor(Math.random() * 20);

  switch (mood) {
    case 'happy':
      let happyPrompts = dataJson[0];
      prompt = happyPrompts[random_int];
      break;
    case 'sad':
      let sadPrompts = dataJson[1];
      prompt = sadPrompts[random_int];
      break;
    case 'excited':
      let excitedPrompts = dataJson[2];
      prompt = excitedPrompts[random_int];
      break;
    case 'bored':
      let boredPrompts = dataJson[3];
      prompt = boredPrompts[random_int];
      break;
    case 'tired':
      let tiredPrompts = dataJson[4];
      prompt = tiredPrompts[random_int];
      break;
    default:
      prompt = "I am feeling good";
  }

  // Send a loading message
  await interaction.reply("Hang in there! Loading...");

  // Add the mood to the message array
  console.log(`Prompt: ${prompt}`);
  const new_mood = {role: "user", content: `my mood is like: ${prompt}`};
  message.push(new_mood);

  // Send the mood to the GPT-3 API
  const gptResponse = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    //prompt: custom_prompt,
    max_tokens: 2048,
    messages: message,
    temperature: 0.8,
    top_p: 0.3,
    presence_penalty: 0,
    frequency_penalty: 0.5,
  });
  result = gptResponse.data.choices[0].message.content;
  const keyword = "Prompt:";

  const finalResult = result.split(keyword);

  const channel = client.channels.cache.get('1108311184953835521');

  let motivation_text = finalResult[0];
  let image_prompt = `${finalResult[1]}, hyperrealistic, 4K`;
  channel.send(motivation_text);
  console.log(image_prompt);
  new_assistant_response = {role:"assistant", content: `${gptResponse.data.choices[0].message.content}`};
  message.push(new_assistant_response);
  console.log(message);

  // Send the image prompt to the GPT-3 API
  const response = await openai.createImage({
    prompt: image_prompt,
    n: 1,
    size: "1024x1024",
  });
  image_url = response.data.data[0].url;
  console.log(image_url);
  //const attachment = new MessagePayload(channel, { files: [`${image_url}`] });
  channel.send(`${image_url}`);


};

client.on('interactionCreate', async (interaction) => {
  // Handle the interaction here
  console.log(`Interaction received: ${interaction.customId}`);
  await handleInteraction(interaction);
});

// Send mood options when the bot is ready
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Schedule mood prompts every 2 minutes
  setInterval(() => {
    console.log('Sending mood options');
    const channel = client.channels.cache.get('1108311184953835521'); // Replace with the actual channel ID where you want the bot to send the mood prompts
      sendMoodOptions(channel);
  }, 1 * 20 * 1000); // 2 minutes in milliseconds 1000 kam kar
});

// chatGPT function to send messages to the GPT-3 API and get a response
client.on("messageCreate", function(message) {
        if (message.author.bot) return;

        let prompt = `You: ${message.content}\n`;
       (async () => {
             const gptResponse = await openai.createCompletion({
                 model: "text-davinci-003",
                 prompt: prompt,
                 max_tokens: 2048,
                 temperature: 0.5,
                 top_p: 0.3,
                 presence_penalty: 0,
                 frequency_penalty: 0.5,
               });
             message.reply(`${gptResponse.data.choices[0].text.substring(5)}`);
             prompt += `${gptResponse.data.choices[0].text}\n`;
         })();           
     
 });

 // Login to Discord with your client's token
client.login(process.env.BOT_TOKEN);