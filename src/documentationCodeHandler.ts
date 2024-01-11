import { TextLoader } from "langchain/document_loaders/fs/text";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { ConversationalRetrievalQAChain } from 'langchain/chains';
import { CharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from "langchain/document";
import * as dotenv from 'dotenv';
import * as fs from "fs";
import * as path from 'path';
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { formatDocumentsAsString } from "langchain/util/document";

dotenv.config({path: __dirname + '/.env'});

export async function documentationCodeHandler(rootPath: string, fileName: string) {
  try {

    let urls_encontradas = buscar_urls_em_diretorio(rootPath);

    let documents: Document<Record<string, any>>[] = [];
    for (let url of urls_encontradas) {
      try {
        let loader = new TextLoader(url);
        documents.push(...await loader.load());
      } catch {
        console.log(url);
      }
    }

    // Split the documents into smaller chunks
    let text_splitter = new CharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 10 });
    documents = await text_splitter.splitDocuments(documents);

    // Convert the document chunks to embedding and save them to the vector store
    let vectordb = await Chroma.fromDocuments(documents, new OpenAIEmbeddings(), {
      collectionName: "documentation",
      url: "http://localhost:8000", // Optional, will default to this value
      collectionMetadata: {
        "hnsw:space": "cosine",
      }});


    let model = new ChatOpenAI({ temperature: 0.7, modelName: 'gpt-3.5-turbo-16k' });

    let questionPrompt = PromptTemplate.fromTemplate(`Dado o código fornecido abaixo, por favor, crie uma documentação detalhada para o projeto. A documentação deve incluir:
    Uma visão geral do propósito do projeto.
    Descrições detalhadas de cada módulo/função principal.
    Listagem dos requisitos de sistema e dependências.
    Exemplos de uso para demonstrar a funcionalidade do código.
    Quaisquer considerações de desempenho ou limitações conhecidas.
    Instruções claras sobre como configurar e executar o projeto.
    Código do Projeto:
    {context}
    Arquivo quem precisa de documentaçao:
    {fileName}
    Notas adicionais:
    Considere que a documentação deve ser clara e concisa, visando facilitar a compreensão para desenvolvedores iniciantes.
    Se necessário, adicione explicações sobre a estrutura do código e padrões de design utilizados.
    Certifique-se de incluir exemplos de entrada/saída para as principais funcionalidades.
    Caso existam escolhas de design específicas, explique o raciocínio por trás delas.
    Se houver partes do código que são mais complexas, destaque essas áreas na documentação.`);

    
    const chain = RunnableSequence.from([
      {
        fileName: (input: { fileName: string; chatHistory?: string }) =>
          input.fileName,
        chatHistory: (input: { fileName: string; chatHistory?: string }) =>
          input.chatHistory ?? "",
        context: async (input: { fileName: string; chatHistory?: string }) => {
          const relevantDocs = await vectordb.asRetriever({ k: 6 }).getRelevantDocuments(input.fileName);
          const serialized = formatDocumentsAsString(relevantDocs);
          return serialized;
        },
      },
      questionPrompt,
      model,
      new StringOutputParser(),
    ]);
    
    const result = await chain.invoke({
      fileName: fileName,
    });

    //let result = await pdf_qa.invoke({
    //  question: query,
    //  chat_history: chat_history
    //});


    console.log(`Answer: ${result}`);

//    chat_history.push([query.toString(), result.answer as string]);

    return result;

  } catch (error) {
    console.error(`Erro ao gerar o código do teste: ${error}`);
    return "";
  }
}

function buscar_urls_em_diretorio(diretorio: string): string[] {
  let urls_totais: string[] = [];
  for (let caminho_arquivo of walk(diretorio)) {
    const stats = fs.statSync(caminho_arquivo);
    
    if (stats.isFile() && (path.extname(caminho_arquivo) === '.cs' || path.extname(caminho_arquivo) === '.cshtml')) {
      urls_totais.push(caminho_arquivo);
    }
  }
  return urls_totais;
}

function* walk(path: string): IterableIterator<string> {

  const entries: fs.Dirent[] = fs.readdirSync(path, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath: () => string = () => `${path}/${entry.name}`;

    if (entry.isFile()) {
      yield entryPath();
    }

    if (entry.isDirectory()) {
      yield* walk(entryPath());
    }
  }
}