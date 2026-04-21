import { Injectable, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessagesFilterDto, ConversationsFilterDto } from './dto/messages-filter.dto';
import { WebsocketsService } from '../websockets/websockets.service';

export interface Conversation {
  contactId: string;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    avatar: string | null;
  };
  lastMessage: {
    id: string;
    content: string;
    channel: string;
    direction: string;
    createdAt: Date;
    isRead: boolean;
  } | null;
  unreadCount: number;
  lastChannel: string;
  isPinned: boolean;
  updatedAt: Date;
}

export interface ConversationsResult {
  data: Conversation[];
  total: number;
  channels: {
    channel: string;
    count: number;
    unreadCount: number;
  }[];
}

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => WebsocketsService))
    private websocketsService: WebsocketsService,
  ) {}

  async create(createMessageDto: CreateMessageDto, organizationId: string, userId?: string) {
    // Validate contact exists
    const contact = await this.prisma.contact.findFirst({
      where: { id: createMessageDto.contactId, organizationId },
    });

    if (!contact) {
      throw new NotFoundException('Контакт не найден');
    }

    const message = await this.prisma.message.create({
      data: {
        ...createMessageDto,
        organizationId,
        userId: userId || createMessageDto.userId,
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`Message created: ${message.id} to contact ${createMessageDto.contactId}`);

    // Send real-time notification via WebSocket
    this.websocketsService.notifyNewMessage(createMessageDto.contactId, {
      id: message.id,
      content: message.content,
      channel: message.channel,
      direction: message.direction,
      isRead: message.isRead,
      createdAt: message.createdAt,
      contact: message.contact,
      user: message.user,
    });

    return message;
  }

  async findAll(filter: MessagesFilterDto, organizationId: string) {
    const { contactId, channel, direction, unreadOnly, search, skip = 0, take = 50 } = filter;

    const where: Prisma.MessageWhereInput = {
      organizationId,
      ...(contactId ? { contactId } : {}),
      ...(channel ? { channel } : {}),
      ...(direction ? { direction } : {}),
      ...(unreadOnly ? { isRead: false } : {}),
      ...(search
        ? {
            content: { contains: search, mode: 'insensitive' },
          }
        : {}),
    };

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.message.count({ where }),
    ]);

    return {
      data: messages,
      total,
      skip,
      take,
    };
  }

  async findOne(id: string, organizationId: string) {
    const message = await this.prisma.message.findFirst({
      where: { id, organizationId },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Сообщение не найдено');
    }

    return message;
  }

  async update(id: string, updateMessageDto: UpdateMessageDto, organizationId: string) {
    await this.findOne(id, organizationId);

    return this.prisma.message.update({
      where: { id },
      data: updateMessageDto,
      include: {
        contact: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async markAsRead(id: string, organizationId: string) {
    await this.findOne(id, organizationId);

    return this.prisma.message.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markConversationAsRead(contactId: string, organizationId: string) {
    const result = await this.prisma.message.updateMany({
      where: {
        contactId,
        organizationId,
        isRead: false,
        direction: 'inbound',
      },
      data: { isRead: true },
    });

    this.logger.log(`Marked ${result.count} messages as read for contact ${contactId}`);

    return { count: result.count };
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);

    await this.prisma.message.delete({
      where: { id },
    });

    return { message: 'Сообщение удалено' };
  }

  // ============ Conversations ============

  async getConversations(
    filter: ConversationsFilterDto,
    organizationId: string,
  ): Promise<ConversationsResult> {
    const { channel, search, unreadOnly, skip = 0, take = 20 } = filter;

    // Get all contacts that have messages
    const contactsWithMessages = await this.prisma.contact.findMany({
      where: {
        organizationId,
        messages: {
          some: {
            ...(channel ? { channel } : {}),
          },
        },
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        messages: {
          where: channel ? { channel } : {},
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                direction: 'inbound',
                ...(channel ? { channel } : {}),
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Transform to conversations
    let conversations: Conversation[] = contactsWithMessages.map((contact) => ({
      contactId: contact.id,
      contact: {
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName || '',
        phone: contact.phone,
        email: contact.email,
        avatar: null,
      },
      lastMessage: contact.messages[0]
        ? {
            id: contact.messages[0].id,
            content: contact.messages[0].content,
            channel: contact.messages[0].channel,
            direction: contact.messages[0].direction,
            createdAt: contact.messages[0].createdAt,
            isRead: contact.messages[0].isRead,
          }
        : null,
      unreadCount: contact._count.messages,
      lastChannel: contact.messages[0]?.channel || 'unknown',
      isPinned: false, // TODO: Add pinned conversations feature
      updatedAt: contact.messages[0]?.createdAt || contact.updatedAt,
    }));

    // Filter by unread if needed
    if (unreadOnly) {
      conversations = conversations.filter((c) => c.unreadCount > 0);
    }

    // Sort by last message time
    conversations.sort((a, b) => {
      // Pinned first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Then by date
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

    const total = conversations.length;

    // Apply pagination
    const paginatedConversations = conversations.slice(skip, skip + take);

    // Get channel statistics
    const channelStats = await this.getChannelStats(organizationId);

    return {
      data: paginatedConversations,
      total,
      channels: channelStats,
    };
  }

  async getConversation(contactId: string, organizationId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, organizationId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
      },
    });

    if (!contact) {
      throw new NotFoundException('Контакт не найден');
    }

    const messages = await this.prisma.message.findMany({
      where: { contactId, organizationId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const unreadCount = await this.prisma.message.count({
      where: {
        contactId,
        organizationId,
        isRead: false,
        direction: 'inbound',
      },
    });

    return {
      contact,
      messages,
      unreadCount,
    };
  }

  async getChannelStats(organizationId: string) {
    const channels = ['whatsapp', 'telegram', 'instagram', 'email', 'phone', 'sms'];

    const stats = await Promise.all(
      channels.map(async (channel) => {
        const [totalCount, unreadCount] = await Promise.all([
          this.prisma.message.count({
            where: { organizationId, channel },
          }),
          this.prisma.message.count({
            where: {
              organizationId,
              channel,
              isRead: false,
              direction: 'inbound',
            },
          }),
        ]);

        return {
          channel,
          count: totalCount,
          unreadCount,
        };
      }),
    );

    // Add "all" channel
    const totalMessages = stats.reduce((sum, s) => sum + s.count, 0);
    const totalUnread = stats.reduce((sum, s) => sum + s.unreadCount, 0);

    return [
      { channel: 'all', count: totalMessages, unreadCount: totalUnread },
      ...stats.filter((s) => s.count > 0),
    ];
  }

  async getUnreadCount(organizationId: string, userId?: string) {
    const count = await this.prisma.message.count({
      where: {
        organizationId,
        isRead: false,
        direction: 'inbound',
      },
    });

    return { unreadCount: count };
  }

  // ============ Send Message Helpers ============

  async sendMessage(
    contactId: string,
    content: string,
    channel: string,
    userId: string,
    organizationId: string,
    metadata?: Record<string, any>,
  ) {
    const message = await this.create(
      {
        contactId,
        content,
        channel,
        direction: 'outbound',
        userId,
        metadata,
        isRead: true, // Outbound messages are always "read"
      },
      organizationId,
      userId,
    );

    // TODO: Here we would integrate with actual messaging providers
    // (WhatsApp, Telegram, etc.) to send the message externally

    return message;
  }

  async receiveMessage(
    contactId: string,
    content: string,
    channel: string,
    organizationId: string,
    metadata?: Record<string, any>,
  ) {
    const message = await this.create(
      {
        contactId,
        content,
        channel,
        direction: 'inbound',
        metadata,
        isRead: false,
      },
      organizationId,
    );

    return message;
  }
}
