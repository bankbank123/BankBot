const { DisTube } = require('distube')
const Discord = require('discord.js')
const { MessageEmbed } = require('discord.js')

const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_VOICE_STATES
  ]
})
const fs = require('fs')
const config = require('./config.json')
const { SpotifyPlugin } = require('@distube/spotify')
const { SoundCloudPlugin } = require('@distube/soundcloud')
const { YtDlpPlugin } = require('@distube/yt-dlp')


client.config = require('./config.json')
client.distube = new DisTube(client, {
  leaveOnStop: false,
  emitNewSongOnly: true,
  emitAddSongWhenCreatingQueue: false,
  emitAddListWhenCreatingQueue: false,
  searchSongs: true,
  searchSongs: 10,
  plugins: [
    new SpotifyPlugin({
      emitEventsAfterFetching: true
    }),
    new SoundCloudPlugin(),
    new YtDlpPlugin()
  ],
  youtubeDL: false
})
client.commands = new Discord.Collection()
client.aliases = new Discord.Collection()
client.emotes = config.emoji

fs.readdir('./commands/', (err, files) => {
  if (err) return console.log('Could not find any commands!')
  const jsFiles = files.filter(f => f.split('.').pop() === 'js')
  if (jsFiles.length <= 0) return console.log('Could not find any commands!')
  jsFiles.forEach(file => {
    const cmd = require(`./commands/${file}`)
    console.log(`Loaded ${file}`)
    client.commands.set(cmd.name, cmd)
    if (cmd.aliases) cmd.aliases.forEach(alias => client.aliases.set(alias, cmd.name))
  })
})

client.on('ready', () => {
  console.log(`${client.user.tag} is ready to play music.`)
})

client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return
  const prefix = config.prefix
  if (!message.content.startsWith(prefix)) return
  const args = message.content.slice(prefix.length).trim().split(/ +/g)
  const command = args.shift().toLowerCase()
  const cmd = client.commands.get(command) || client.commands.get(client.aliases.get(command))
  if (!cmd) return
  if (cmd.inVoiceChannel && !message.member.voice.channel) {
    return message.channel.send(`${client.emotes.error} | You must be in a voice channel!`)
  }
  try {
    cmd.run(client, message, args)
  } catch (e) {
    console.error(e)
    message.channel.send(`${client.emotes.error} | Error: \`${e}\``)
  }
})



client.distube
  .on('playSong', (queue, song, message) => queue.textChannel.send({embeds: [new MessageEmbed()
      .setTitle(`${client.emotes.play} | Playing ${song.name} ${client.emotes.music}`)
      .setURL(`${song.url}`)
      .setDescription(`Requested by : ${song.user}`)
      .setThumbnail(`${song.thumbnail}`)
      .setColor("#ff0000")
      .setTimestamp()
      .addFields(
      {
        name: "Duration",
        value: `${song.formattedDuration}`,
        inline: true
      },
      {
        name: "Volume",
        value: `${queue.volume}%`,
        inline: true
      },
      {
        name: "Filter",
        value: `${queue.filters.join(', ') || 'off'}`,
        inline: true
      },
      {
        name: "Loop",
        value: `${queue.repeatMode ? (queue.repeatMode === 2 ? 'All Queue' : 'This Song') : 'off'}`,
        inline: true
      },
      {
        name : "Autoplay",
        value: `${queue.autoplay ? 'On' : 'Off'}`,
        inline: true
      })
      
    ]}
    
    
    )
  )
  .on('addSong', (queue, song) =>
    queue.textChannel.send({embeds: [new MessageEmbed()
      // `${client.emotes.success} | Added ${song.name} - \`${song.formattedDuration}\` to the queue by ${song.user}`
      .setTitle(`${client.emotes.success} | Added ${song.name} ${song.formattedDuration}`)
      .setURL(`${song.url}`)
      .setDescription(`queue by : ${song.user}`)
      .setThumbnail(`${song.thumbnail}`)
      .setColor("#ff0000")
      .setTimestamp()
      .addFields(
      {
        name: "Duration",
        value: `${song.formattedDuration}`,
        inline: true
      },
      {
        name: "Volume",
        value: `${queue.volume}%`,
        inline: true
      },
      {
        name: "Filter",
        value: `${queue.filters.join(', ') || 'off'}`,
        inline: true
      },
      {
        name: "Loop",
        value: `${queue.repeatMode ? (queue.repeatMode === 2 ? 'All Queue' : 'This Song') : 'off'}`,
        inline: true
      },
      {
        name : "Autoplay",
        value: `${queue.autoplay ? 'On' : 'Off'}`,
        inline: true
      })
      
    ]}
    )
  )
  .on('addList', (queue, playlist) =>
    queue.textChannel.send(
      `${client.emotes.success} | Added \`${playlist.name}\` playlist (${
        playlist.songs.length
      } songs) to queue`
    )
  )
  .on('error', (channel, e) => {
    channel.send(`${client.emotes.error} | An error encountered: ${e.toString().slice(0, 1974)}`)
    console.error(e)
  })
  .on('empty', channel => channel.send('Voice channel is empty! Leaving the channel...'))
  .on('searchNoResult', (message, query) =>
    message.channel.send(`${client.emotes.error} | No result found for \`${query}\`!`)
  )
  .on('finish', queue => queue.textChannel.send('Finished!'))

  .on("searchResult", (message, result) => {
    let i = 0
    message.channel.send(
        `**Choose an option from below**\n${result
            .map(song => `**${++i}**. ${song.name} - \`${song.formattedDuration}\``)
            .join("\n")}\n*Enter anything else or wait 60 seconds to cancel*`
    )
})
  .on("searchCancel", message => message.channel.send(`${client.emotes.error} | Searching canceled`))
  .on("searchInvalidAnswer", message =>
    message.channel.send(
        `${client.emotes.error} | Invalid answer! You have to enter the number in the range of the results`
    )
)
.on("searchDone", () => {})
function delay(s) {
  return new Promise(r => setTimeout(r, s));
};
client.login(config.token)
