import { Command } from 'discord-akairo';
import { Message, MessageAttachment, User } from 'discord.js';
import fetch from 'node-fetch';

export default class extends Command {

	public constructor() {
		super('beautiful', {
			aliases: ['beautiful'],
			category: 'image',
			description: {
				content: 'makes a beautiful poster out of your avatar',
				example: '',
				usage: []
			},
			args: [
				{
					id: 'user',
					type: 'user',
					default: (m: Message) => m.author
				}
			]
		});
	}

	public async exec(message: Message, { user }: { user: User }) {
		const msg = await message.util?.send('<a:MitoLoading:787656667575615518> **Generating the image.**');
		const res = await fetch('https://v1.api.amethyste.moe/generate/beautiful', {
			method: 'POST',
			body: JSON.stringify({
				url: user.displayAvatarURL({ format: 'png', size: 512 })
			}),
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${process.env.AME_API}`
			}
		});
		const buffer = await res.buffer();
		const attachment = new MessageAttachment(buffer, 'beautiful.png');
		await message.util?.send(attachment);
		return msg?.delete();
	}

}
