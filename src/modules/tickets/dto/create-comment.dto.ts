import { IsNotEmpty, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty({ message: 'Komentar tidak boleh kosong' })
  @MinLength(2, { message: 'Komentar terlalu pendek' })
  isiKomentar: string;
}
