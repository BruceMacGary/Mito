import { stripIndents } from 'common-tags';
import { Command, PrefixSupplier } from 'discord-akairo';
import { TextChannel, Message } from 'discord.js';

export default class HelpCommand extends Command {

	public constructor() {
		super('help', {
			aliases: ['help', 'command', 'h'],
			category: 'general',
			clientPermissions: ['EMBED_LINKS'],
			args: [
				{
					id: 'command',
					type: 'commandAlias'
				}
			],
			description: {
				content: 'Displays a list of commands or information about a command.',
				usage: '[command]',
				examples: ['ping', 'dadjokes', 'kick']
			}
		});
	}

	public async exec(message: Message, { command }: { command: Command }) {
		if (!command) return this.execCommandList(message);
		const prefix = (this.handler.prefix as PrefixSupplier)(message) as string;

		const description = Object.assign({
			content: 'No description available.',
			usage: '',
			examples: [],
			fields: []
		}, command.description);

		const embed = this.client.util.embed()
			.setColor('#ffa053')
			.setTitle(`\`${prefix}${command.aliases[0]} ${description.usage}\``)
			.addField('• Description', description.content);

		for (const field of description.fields) embed.addField(field.name, field.value);

		if (description.examples.length) {
			const text = `${prefix}${command.aliases[0]}`;
			embed.addField('• Examples', `\`${text} ${description.examples.join(`\`\n\`${text} `)}\``, true);
		}

		if (command.aliases.length > 1) {
			embed.addField('• Aliases', `\`${command.aliases.join('` `')}\``, true);
		}

		return message.util?.send({ embed });
	}

	public async execCommandList(message: Message) {
		const commands = [];
		let page = 0;
		// const embed = this.client.util.embed()
		// 	.setAuthor('Mito - Help', this.client.user?.displayAvatarURL())
		// 	.setColor('#ffa053')
		// 	.setFooter('More commands soon! | Re-write 60%', message.author.displayAvatarURL({ dynamic: true }))
		// 	.setDescription(`Guild Prefix: \`${(this.handler.prefix as PrefixSupplier)(message) as string}\`\nTo get detailed info of a specific cmd, do \`${(this.handler.prefix as PrefixSupplier)(message) as string}help <command>\`\n<:MitoInvite:781892249859784745> **[Invite](https://discord.com/oauth2/authorize?client_id=761469922563063818&permissions=8&scope=bot)** **|** <:MitoSupport:781892074919297064> **[Support Server](https://discord.com/invite/mDF5QPG)** **|** <:rich_presence:790128525533249566> **[Source Code](https://github.com/TheMitobot/Mito)** **|** <:MitoUpvote:781892694129508352> **[Upvote](https://top.gg/bot/761469922563063818/vote)**`);
		for (const category of (message.channel as TextChannel).nsfw ? this.handler.categories.filter(f => f.id !== 'owner').values() : this.handler.categories.filter(f => f.id !== 'owner' && f.id !== 'nsfw' && f.id !== 'default').values()) {
			++page;
			commands.push({
				embed: {
					color: 0xffa053,
					footer: {
						text: `Page ${page}`
					},
					title: `${category.id.replace(/(\b\w)/gi, lc => lc.toUpperCase())}`,
					description: category
						.filter(cmd => cmd.aliases.length > 0)
						.map(cmd => stripIndents`
							\`${cmd.aliases[0]}\`
						`).join(' **|** ')
				}
			});
		}

		return this.paginate(message, commands);
	}

	private async paginate(message: Message, pages: Array<any>): Promise<Message> {
		let page = 0;
		const emojiList = ['⬅️', '➡️'];
		const msg = await message.util?.send(pages[page]);

		for (const emoji of emojiList) {
			await msg?.react(emoji);
		}

		const collector = msg?.createReactionCollector(
			(reaction, user) => emojiList.includes(reaction.emoji.name) && user.id === message.author.id,
			{ time: 45000, max: 10 }
		);

		collector?.on('collect', async reaction => {
			await reaction.users.remove(message.author);
			switch (reaction.emoji.name) {
				case emojiList[0]:
					page = page > 0 ? --page : pages.length - 1;
					break;
				case emojiList[1]:
					page = page + 1 < pages.length ? ++page : 0;
					break;
				default:
					break;
			}
			await msg?.edit(pages[page]);
		});

		collector?.on('end', async () => {
			await msg?.reactions.removeAll().catch(() => null);
		});

		return msg!;
	}

}
