import { Controller, Post, Body, Get, Put, UseGuards, Request, HttpCode, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@ApiTags('Auth')
    @Controller('auth')
    export class AuthController {
    constructor(private auth: AuthService) {}

@Post('login')
    @HttpCode(200)
    @UseGuards(AuthGuard('local'))
    login(@Request() req: any) { return this.auth.login(req.user); }

@Get('technicians')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    technicians() { return this.auth.getTechnicians(); }

@Get('users')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    getUsers() { return this.auth.getUsers(); }

@Post('register')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    register(@Body() body: any) { return this.auth.register(body); }

@Put('users/:id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    updateUser(@Param('id') id: string, @Body() body: any) { return this.auth.updateUser(id, body); }

@Put('users/:id/permissions')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    updatePermissions(@Param('id') id: string, @Body() body: any) { return this.auth.updatePermissions(id, body.permissions); }

@Put('users/:id/contact')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    updateContact(@Param('id') id: string, @Body() body: any) { return this.auth.updateContact(id, body); }

@Put('users/:id/password')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    resetPassword(@Param('id') id: string, @Body() body: any) { return this.auth.resetPassword(id, body.password); }

@Put('users/:id/status')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    updateStatus(@Param('id') id: string, @Body() body: any) { return this.auth.updateStatus(id, body.isActive); }

@Get('me')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    profile(@Request() req: any) { return this.auth.getProfile(req.user.sub); }
}
