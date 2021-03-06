import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
// o path.resolve vai fazer a leitura do caminho dos arquivos
import { resolve } from 'path';

import { UsersRepository } from '../../repositories/UsersRepository';
import { SurveysRepository } from '../../repositories/SurveysRepository';
import { SurveysUsersRepository } from '../../repositories/SurveysUsersRepository';

import { AppError } from '../../errors/AppError';

import SendMailService from '../../services/SendMailService';

export default async function execute(request: Request, response: Response) {
  const { email, survey_id } = request.body;

  const usersRepository = getCustomRepository(UsersRepository);
  const surveysRepository = getCustomRepository(SurveysRepository);
  const surveysUsersRepository = getCustomRepository(SurveysUsersRepository);

  const userAlreadyExists = await usersRepository.findOne({ email });

  // se o usuário não existir vai retornar um erro 
  if (!userAlreadyExists) {
    throw new AppError("User does not exists!");
  };

  const surveyAlreadyExists = await surveysRepository.findOne({ id: survey_id });

  if (!surveyAlreadyExists) {
    throw new AppError("Survey does not exists!");
  };

  // __dirname vai pegar o diretório exato da aplicação 
  const npsPath = resolve(__dirname, "..", "..", "views", "emails", "npsMail.hbs");

  // se tiver alguma pesquisa para aquele id do usuário que tenha o valor de
  // como nulo então a aplicação vai retornar para mim
  const surveyUserAlreadyExists = await surveysUsersRepository.findOne({
    where: { user_id: userAlreadyExists.id, value: null },
    relations: ["user", "survey"],
  });

  const variables = {
    name: userAlreadyExists.name,
    title: surveyAlreadyExists.title,
    description: surveyAlreadyExists.description,
    id: "",
    link: process.env.URL_MAIL
  };

  if (surveyUserAlreadyExists) {
    // se existir uma pesquisa do usuário então eu vou colocar o valor de id nas
    // variables como o id da
    // pesquisa do usuário que existe(surveyUserAlreadyExists)
    variables.id = surveyUserAlreadyExists.id;
    await SendMailService.executeMailSend(
      email, 
      surveyAlreadyExists.title,
      variables,
      npsPath
    );

    return response.json(surveyUserAlreadyExists);
  }

  // salvar as informações na tabela survey_user
  const surveyUser = surveysUsersRepository.create({
    user_id: userAlreadyExists.id,
    survey_id
  });

  
  await surveysUsersRepository.save(surveyUser);

  // se não existir uma pesquisa do usuário, depois de salvar no banco de dados
  // vai colcar o id que foi gerado(criado) como o id dentro das variables
  variables.id = surveyUser.id;

  // enviar e-mail para o usuário
  await SendMailService.executeMailSend(
    email, 
    surveyAlreadyExists.title, 
    variables, 
    npsPath
  );

  return response.status(201).json(surveyUser);
};