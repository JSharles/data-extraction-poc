import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class CreateSubmissionDto {
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^(\+?\d{1,3}[\s-]?)?\d{9,10}$/, {
    message: 'Invalid phone number',
  })
  phone!: string;
}
