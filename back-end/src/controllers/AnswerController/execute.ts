import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';

import { SurveysUsersRepository } from '../../repositories/SurveysUsersRepository';

export default async function execute(request: Request, response: Response) {
  // Route Params => Parâmetros que são enviados na rota, que compõe a rota e 
  // os Route Params são obrigatórios na rota

  // Query Params => São parâmetros itilizados para Busca, Paginação são
  // parâmetros não obrigatórios e esse parâmetro sempre vai vir depois do ?
  // e a forma dele é chave=valor

  // pagando o value dos Route Params
  const { value } = request.params;
  // pegando o u dos Qury Params
  const { u } = request.query;

  const surveysUsersRepository = getCustomRepository(SurveysUsersRepository);

  const surveyUser = await surveysUsersRepository.findOne({
    // eu estou forçando o valor de u ser uma String porque o id espera uma
    // String e se não fizer isso vai dar erro porque o u está vindo dos 
    // Query Params e esses parâmetros não são obrigatórios, ou seja, eles
    // podem não vir
    id: String(u)
  });

  if (!surveyUser) {
    return response.status(400).json({ error: "Survey User does not exists!" });
  };

  // estou forçando o value que esta vindo dos Route Params a ser um Number
  // porque o surveyUser.value espera um number
  surveyUser.value = Number(value);

  await surveysUsersRepository.save(surveyUser);

  return response.json(surveyUser);
};