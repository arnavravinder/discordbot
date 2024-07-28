const { Client, Intents, MessageAttachment } = require('discord.js');
const pdf = require('html-pdf');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.once('ready', () => {
    console.log('Bill Maker Bot is online! 🧾');
});

client.on('messageCreate', async message => {
    if (message.content.startsWith('!bill')) {
        const args = message.content.slice(5).trim().split(';');
        if (args.length < 6) {
            message.channel.send('Please provide all required fields in the format: `!bill Client Name; Client Address; Client Email; Bill Date; Due Date; [Item Description, Quantity, Price]; ...`');
            return;
        }

        const [clientName, clientAddress, clientEmail, billDate, dueDate, ...items] = args;
        const billItems = items.map(item => {
            const [description, quantity, price] = item.split(',');
            return { description, quantity: parseInt(quantity), price: parseFloat(price) };
        });

        let totalAmount = 0;
        const billHtml = `
            <h1>Bill</h1>
            <p><strong>Client Name:</strong> ${clientName}</p>
            <p><strong>Client Address:</strong> ${clientAddress}</p>
            <p><strong>Client Email:</strong> ${clientEmail}</p>
            <p><strong>Bill Date:</strong> ${billDate}</p>
            <p><strong>Due Date:</strong> ${dueDate}</p>
            <table border="1" cellspacing="0" cellpadding="5">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${billItems.map(item => {
                        const total = item.quantity * item.price;
                        totalAmount += total;
                        return `
                            <tr>
                                <td>${item.description}</td>
                                <td>${item.quantity}</td>
                                <td>${item.price.toFixed(2)}</td>
                                <td>${total.toFixed(2)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3">Total Amount</td>
                        <td>${totalAmount.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        `;

        pdf.create(billHtml).toBuffer((err, buffer) => {
            if (err) {
                message.channel.send('There was an error generating the bill PDF.');
                console.error(err);
                return;
            }

            const attachment = new MessageAttachment(buffer, 'bill.pdf');
            message.channel.send({ content: 'Here is your bill:', files: [attachment] });
        });
    }
});

client.login('--');
