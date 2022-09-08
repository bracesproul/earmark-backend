const dotenv = require('dotenv')
dotenv.config({path:__dirname+'./../../../.env'});
const { EmbedBuilder, WebhookClient } = require('discord.js');

const webhookUrl = 'https://discord.com/api/webhooks/1017554966086430780/ctoUiQCjbup3TxDaiRI-UoUYsU54ZXkeoX6llxF6FZkMKgVK2mpiVIcaEW1mxnBxHRV1';

const webhookClient = new WebhookClient({ url: webhookUrl });

function sendWebhook(user_email: string, user_id: string) {
    const embed = new EmbedBuilder()
        .setTitle('User logged in.')
        .addFields(
            { name: 'User ID:', value: user_id },
            { name: 'User Email:', value: user_email },
        )
        .setTimestamp()
        .setColor([0, 255, 0]);

    webhookClient.send({
        username: 'Earmark Bot',
        content: `<@479069058864775180>`,
        embeds: [embed],
    }).then(() => {console.log('Webhook sent!')});
}

module.exports = {sendWebhook};

