import { REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const commands = [];
const commandsPath = path.join(process.cwd(), "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(`file://${filePath}`);
  if (!command.default?.data) continue;
  commands.push(command.default.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("🚀 Deploying commands…");

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.DEV_GUILD_ID),
      { body: commands }
    );
    console.log("⚡ Instant commands deployed to DEV server.");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("🌍 Global commands deployed (will take a few minutes).");
  } catch (error) {
    console.error(error);
  }
})();