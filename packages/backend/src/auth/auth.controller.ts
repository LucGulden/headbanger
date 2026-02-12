import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { FastifyRequest, FastifyReply } from 'fastify'
import { AuthService } from './auth.service'
import { AuthGuard } from './guards/auth.guard'
import { RefreshGuard } from './guards/refresh.guard'
import { CurrentUser } from './decorators/current-user.decorator'
import { CurrentSession } from './decorators/current-session.decorator'
import { SignUpDto } from './dto/signup.dto'
import { LoginDto } from './dto/login.dto'
import { Session, AuthenticatedUser } from '../common/database/database.types'

// Options cookies communes
const getCookieOptions = (isProduction: boolean) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict' as const,
  domain: process.env.COOKIE_DOMAIN || undefined,
  path: '/',
})

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() dto: SignUpDto, @Req() request: FastifyRequest, @Res() reply: FastifyReply) {
    const ip = request.ip
    const userAgent = request.headers['user-agent']

    const { jwt, csrfToken, userId } = await this.authService.signup(
      dto.email,
      dto.username,
      dto.password,
      ip,
      userAgent,
    )

    const isProduction = process.env.NODE_ENV === 'production'

    // Cookie auth_token (httpOnly)
    reply.setCookie('auth_token', jwt, {
      ...getCookieOptions(isProduction),
      maxAge: 15 * 60, // 15 minutes (en secondes)
    })

    // Cookie csrf_token (lisible en JS)
    reply.setCookie('csrf_token', csrfToken, {
      ...getCookieOptions(isProduction),
      httpOnly: false, // Accessible côté client
      maxAge: 24 * 60 * 60, // 24 heures
    })

    return reply.send({ id: userId })
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() request: FastifyRequest, @Res() reply: FastifyReply) {
    const ip = request.ip
    const userAgent = request.headers['user-agent']

    const { jwt, csrfToken, userId } = await this.authService.login(
      dto.email,
      dto.password,
      ip,
      userAgent,
    )

    const isProduction = process.env.NODE_ENV === 'production'

    // Cookie auth_token (httpOnly)
    reply.setCookie('auth_token', jwt, {
      ...getCookieOptions(isProduction),
      maxAge: 15 * 60, // 15 minutes
    })

    // Cookie csrf_token (lisible en JS)
    reply.setCookie('csrf_token', csrfToken, {
      ...getCookieOptions(isProduction),
      httpOnly: false,
      maxAge: 24 * 60 * 60, // 24 heures
    })

    return reply.send({ id: userId })
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentSession() session: Session, @Res() reply: FastifyReply) {
    await this.authService.logout(session.id)

    // Clear cookies
    reply.clearCookie('auth_token', {
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined,
    })
    reply.clearCookie('csrf_token', {
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined,
    })

    return reply.send({ success: true })
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@CurrentUser() user: AuthenticatedUser) {
    // Retourne juste l'ID pour l'instant
    // Le frontend fera un appel à /users/:id pour les détails complets
    return { id: user.id }
  }

  @Post('refresh')
  @UseGuards(RefreshGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(@CurrentSession() session: Session, @Res() reply: FastifyReply) {
    const jwt = await this.authService.refresh(session.id)

    const isProduction = process.env.NODE_ENV === 'production'

    // Nouveau cookie auth_token
    reply.setCookie('auth_token', jwt, {
      ...getCookieOptions(isProduction),
      maxAge: 15 * 60, // 15 minutes
    })

    return reply.send({ success: true })
  }
}
