import {
  SlashCommandBuilder,
  PermissionFlagsBits
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("restore")
    .setDescription("Restores server roles and channels from a JSON backup.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addAttachmentOption(option =>
      option
        .setName("file")
        .setDescription("Upload the server-backup.json file")
        .setRequired(true)
    ),

  async execute(interaction) {
    const file = interaction.options.getAttachment("file");
    if (!file.name.endsWith(".json")) {
      return interaction.reply({
        content: "❌ Please upload a valid JSON backup file.",
        ephemeral: true
      });
    }

    await interaction.reply("📥 Downloading backup…");
    const response = await fetch(file.url);
    const json = await response.json();
    const guild = interaction.guild;

    await interaction.followUp("🔧 Restoring roles…");
    const roleMap = new Map();
    const sortedRoles = json.roles.sort((a, b) => a.position - b.position);

    for (const role of sortedRoles) {
      if (role.name === "@everyone") {
        roleMap.set(role.id, guild.roles.everyone.id);
        continue;
      }
      try {
        const newRole = await guild.roles.create({
          name: role.name,
          color: role.color,
          permissions: BigInt(role.permissions),
          reason: "Server restore"
        });
        roleMap.set(role.id, newRole.id);
      } catch (err) {
        console.error("Failed to create role:", role.name, err);
      }
    }

    await interaction.followUp("📁 Restoring categories…");
    const channelMap = new Map();
    const categories = json.channels.filter(c => c.type === 4);

    for (const cat of categories) {
      try {
        const newCat = await guild.channels.create({
          name: cat.name,
          type: 4,
          position: cat.position,
          reason: "Server restore"
        });
        channelMap.set(cat.id, newCat.id);
      } catch (err) {
        console.error("Failed to create category:", cat.name, err);
      }
    }

    await interaction.followUp("📨 Restoring channels…");
    const normalChannels = json.channels.filter(c => c.type !== 4);

    for (const ch of normalChannels) {
      try {
        const newChannel = await guild.channels.create({
          name: ch.name,
          type: ch.type,
          parent: ch.parentId ? channelMap.get(ch.parentId) : null,
          position: ch.position,
          reason: "Server restore"
        });
        channelMap.set(ch.id, newChannel.id);
      } catch (err) {
        console.error("Failed to create channel:", ch.name, err);
      }
    }

    await interaction.followUp("✅ Restore complete.");
  }
};