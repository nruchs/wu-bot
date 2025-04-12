// index.js
const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: ['CHANNEL'] // necessário para enviar DMs
});

const TOKEN = 'MTE5NjQ5NTA4NjY5NjAyNjEyMg.GujyBV.p5CciBWqGXano-qZXkyFXEFbFBMtwRcXKetVHQ'; // Troque pelo seu token

// Função para aguardar um tempo antes de continuar
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Carrega o arquivo de IDs de usuários já notificados
const arquivoEnviados = './jaEnviados.json';
let enviados = new Set();

// Verifica se o arquivo existe e carrega os dados
if (fs.existsSync(arquivoEnviados)) {
  const dados = fs.readFileSync(arquivoEnviados, 'utf-8');
  enviados = new Set(JSON.parse(dados));
}

// Função para salvar os IDs de usuários que já receberam a mensagem
function salvarEnviados() {
  fs.writeFileSync(arquivoEnviados, JSON.stringify([...enviados], null, 2));
}

// Função para enviar mensagens com embed
async function enviarMensagemEmbed(member, embed, imageLink) {
  try {
    await member.send({
      embeds: [embed],
      files: [imageLink]
    });
    console.log(`✅ Mensagem enviada para ${member.user.tag}`);
    enviados.add(member.user.id); // Adiciona o ID ao Set
    await wait(1500); // Pausa de 1.5s entre as mensagens para evitar rate limit
  } catch (err) {
    if (err.code === 50007) { // Código de erro para bloqueio de DM
      console.log(`⚠️ Não foi possível enviar para ${member.user.tag}, DM bloqueada.`);
    } else {
      console.log(`❌ Erro ao enviar para ${member.user.tag}: ${err.message}`);
    }
  }
}

// Função para enviar mensagens simples com várias imagens
async function enviarMensagemSimples(member, messageContent, imageLinks) {
  try {
    await member.send({
      content: messageContent,
      files: imageLinks
    });
    console.log(`✅ Mensagem simples enviada para ${member.user.tag}`);
    enviados.add(member.user.id); // Adiciona o ID ao Set
    await wait(1500); // Pausa de 1.5s entre as mensagens para evitar rate limit
  } catch (err) {
    if (err.code === 50007) { // Código de erro para bloqueio de DM
      console.log(`⚠️ Não foi possível enviar para ${member.user.tag}, DM bloqueada.`);
    } else {
      console.log(`❌ Erro ao enviar para ${member.user.tag}: ${err.message}`);
    }
  }
}

client.once('ready', () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.content.startsWith('!enviardmembed')) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Apenas administradores podem usar este comando.');
    }

    const members = await message.guild.members.fetch();
    const embed = new EmbedBuilder()
      .setTitle('📢 Aviso importante!')
      .setDescription(`Olá, ${message.author.username}! Temos novidades incríveis no servidor! 🎉`)
      .setColor('#0099ff')
      .setFooter({ text: 'Equipe Warlords' });

    const imageLink = 'https://runescape.wiki/images/Pharaoh%27s_Folly_head_banner.jpg?c4cf1';

    let successCount = 0;
    let errorCount = 0;
    let blockedCount = 0;

    for (const member of members.values()) {
      if (!member.user.bot && !enviados.has(member.user.id)) {
        await enviarMensagemEmbed(member, embed, imageLink);
        successCount++;
      }
    }

    salvarEnviados(); // Salva os IDs dos membros para evitar duplicação

    message.reply(`📨 Mensagens enviadas: ${successCount} com sucesso, ${blockedCount} bloqueadas, ${errorCount} com erro.`);
  }

  if (message.content.startsWith('!enviardmsimples')) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Apenas administradores podem usar este comando.');
    }

    const members = await message.guild.members.fetch();
    const messageContent = '🔔 Aviso importante: Não perca as atualizações do servidor! 🎉';
    const imageLinks = [
      'https://runescape.wiki/images/Pharaoh%27s_Folly_head_banner.jpg?c4cf1',
      'https://runescape.wiki/images/RS_Ahead_at_RuneFest_-_Havenhythe%2C_Leagues_and_More_Revealed%21_%2821%29_update_image.jpg?be215'
    ];

    let successCount = 0;
    let errorCount = 0;
    let blockedCount = 0;

    for (const member of members.values()) {
      if (!member.user.bot && !enviados.has(member.user.id)) {
        await enviarMensagemSimples(member, messageContent, imageLinks);
        successCount++;
      }
    }

    salvarEnviados(); // Salva os IDs dos membros para evitar duplicação

    message.reply(`📨 Mensagens simples enviadas: ${successCount} com sucesso, ${blockedCount} bloqueadas, ${errorCount} com erro.`);
  }
});

client.login(TOKEN);
