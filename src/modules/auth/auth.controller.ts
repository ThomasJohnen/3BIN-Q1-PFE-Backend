import {
    Body,
    ConflictException,
    Controller,
    HttpCode,
    NotFoundException,
    Post,
    ValidationPipe,
    Get,
    Headers,
    Patch,
    Param,
    Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Admin } from 'src/schemas/admin.schema';
import { RegisteAdminDTO } from 'src/dto/RegisteAdminDTO';
import { LoginDTO } from 'src/dto/LoginDTO';
import { QuestionAnswer } from 'src/schemas/questionAnswer.schema';
import { CompanyDTO } from 'src/dto/CompanyDTO';

/**
 * The controller for the auth module.
 * API paths: /authAdmin
 * URL: http://localhost:3000/auth
 */
@Controller('authAdmin')
export class AuthController {
    /**
     * The auth service.
     */
    private readonly userService: AuthService;

    /**
     * The constructor of the auth controller.
     * @param userService The auth service.
     */
    constructor(userService: AuthService) {
        this.userService = userService;
    }

    /**
     * Create a new admin.
     * @param user The auth to create.
     * @returns {Promise<Admin>} The created auth.
     */
    @Post('register-admin')
    @HttpCode(201)
    async registerAdmin(@Body(new ValidationPipe()) user: RegisteAdminDTO): Promise<Admin> {
        const userFound: Admin = await this.userService.getAdminByEmail(user.email);
        if (userFound) {
            throw new ConflictException('User already exists');
        }
        return this.userService.register(user);
    }

    /**
     * Login a user.
     * @param user The user to login.
     * @returns {Promise<Admin>} The logged-in user.
     */
    @Post('login-admin')
    @HttpCode(200)
    async login(@Body(new ValidationPipe()) user: LoginDTO): Promise<Admin> {
        const userFound = await this.userService.getAdminByEmail(user.email);
        if (!userFound) {
            console.log('User not found');
            return null;
        }
        return await this.userService.login(user, userFound);
    }

    /**
     * Verify a user.
     * @param token The token to verify.
     * @returns {Promise<Admin>} The verified user.
     */
    @Get('verify-admin')
    @HttpCode(200)
    async verify(@Headers('Authorization') token: string): Promise<Admin> {
        return this.userService.verify(token);
    }

    /**
     * Verify a user.
     * @param token The token to verify.
     * @returns {Promise<Boolean>} The verified user.
     */
    @Get('verify-admin-bool')
    @HttpCode(200)
    async verifyBool(@Headers('Authorization') token: string): Promise<boolean> {
        try {
            if (!(await this.userService.verify(token))) {
                return false;
            }
        } catch (error) {
            return false;
        }
        return true;
    }

    /**
     * Verify password updated.
     * @param email The email of the user.
     * @returns {Promise<boolean>} True if the password is updated, false otherwise.
     */
    @Post('verify-password-updated')
    @HttpCode(200)
    async verifyPasswordUpdated(@Body('email', new ValidationPipe()) email: string): Promise<boolean> {
        const user = await this.userService.getAdminByEmail(email);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return await this.userService.verifyPasswordUpdated(user);
    }

    @Get('answerFormUser')
    @HttpCode(200)
    async getAnswerFormUser(
        @Query('email') email: string,
        @Headers('Authorization') token: string,
    ): Promise<QuestionAnswer[]> {
        this.userService.verify(token);
        try {
            return this.userService.getAnswerFormUser(email);
        } catch (error) {
            throw new NotFoundException('User not found');
        }
    }

    @Post('answerFormUser')
    @HttpCode(201)
    async postAnswerFormUser(
        @Body('email', new ValidationPipe()) email: string,
        @Body('answers', new ValidationPipe()) answers: QuestionAnswer[],
        @Headers('Authorization') token: string,
    ): Promise<void> {
        this.userService.verify(token);
        try {
            await this.userService.postAnswerFormUser(email, answers);
        } catch (error) {
            throw new NotFoundException('User not found');
        }
    }

    /**
     * Update the password of a user.
     * @param password The new password.
     * @param token The token to update the password.
     * @returns {Promise<{ success: boolean; message: string }>} The result of the update.
     */
    @Patch('update-password')
    @HttpCode(200)
    async updatePasswordAdmin(
        @Body('password', new ValidationPipe()) password: string,
        @Headers('Authorization') token: string,
    ): Promise<{ success: boolean; message: string }> {
        const decoded = await this.userService.verify(token);
        const email = decoded.email;

        await this.userService.updatePasswordAdmin(email, password);

        return {
            success: true,
            message: 'Password updated successfully',
        };
    }

    @Get('validatedFormUser')
    @HttpCode(201)
    async validatedFormUser(
        @Query('email', new ValidationPipe()) email: string,
        @Headers('Authorization') token: string,
    ): Promise<boolean> {
        this.userService.verify(token);
        try {
            return this.userService.validatedFormUser(email);
        } catch (error) {
            throw new NotFoundException('User not found');
        }
    }

    @Get('allcompanies')
    @HttpCode(200)
    async getAllCompanies(@Headers('Authorization') token: string): Promise<CompanyDTO[]> {
        this.userService.verify(token);
        return this.userService.getAllCompanies();
    }
}
