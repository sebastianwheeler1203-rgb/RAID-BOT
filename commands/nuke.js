import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  AttachmentBuilder
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("nuke")
    .setDescription("DMs you a JSON backup of the server, then deletes ALL channels and roles.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option
        .setName("confirm")
        .setDescription("Type YES to confirm the nuke")
        .setRequired(true)
    ),

  async execute(interaction) {
    const confirm = interaction.options.getString("confirm");
    if (confirm !== "YES") {
      return interaction.reply({
        content: "❌ You must type **YES** to confirm the nuke.",
        ephemeral: true
      });
    }

    await interaction.reply("📦 Creating server backup…");
    const guild = interaction.guild;

    const exportData = {
      guildId: guild.id,
      guildName: guild.name,
      roles: [],
      channels: []
    };

    guild.roles.cache.forEach(role => {
      exportData.roles.push({
        id: role.id,
        name: role.name,
        color: role.color,
        position: role.position,
        permissions: role.permissions.bitfield
      });
    });

    guild.channels.cache.forEach(channel => {
      exportData.channels.push({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        parentId: channel.parentId,
        position: channel.rawPosition
      });
    });

    const jsonBuffer = Buffer.from(JSON.stringify(exportData, null, 2));
    const jsonFile = new AttachmentBuilder(jsonBuffer, { name: "server-backup.json" });

    try {
      await interaction.user.send({
        content: "📁 Here is your server backup JSON.",
        files: [jsonFile]
      });
    } catch {
      return interaction.followUp("❌ I couldn't DM you. Open your DMs and try again.");
    }

    await interaction.followUp("💣 Backup sent. Nuking server…");

    for (const [id, channel] of guild.channels.cache) {
      try {
        await channel.delete("Nuke command executed");
      } catch (err) {
        console.error(`Failed to delete channel ${id}`, err);
      }
    }

    for (const [id, role] of guild.roles.cache) {
      if (role.name === "@everyone") continue;
      try {
        await role.delete("Nuke command executed");
      } catch (err) {
        console.error(`Failed to delete role ${id}`, err);
      }
    }

    return interaction.followUp("✅ Nuke complete.");
  }
};