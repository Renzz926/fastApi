const vscode = require('vscode');
const fs = require('fs');

const handleJson = (data, projectAbsPath) => {
  let contentTemplate = `import { defHttp } from "@/plugins/http/axios";`;
  const json = JSON.parse(data);

  let myTags = Array.isArray(json.tags) ? [...json.tags] : [];
  myTags.forEach((tag) => (tag.content = ''));

  for (let key in json.paths) {
    let apiItem = json.paths[key];
    for (let method in apiItem) {
      let item = apiItem[method];
      let curTag = myTags.find((v) => v.name === item.tags[0]);
      // 生成api
      curTag.content += `

// ${item.summary}
export const ${item.operationId} = (params) => defHttp.${method}({ url: \`${
        json.basePath
      }${key.replace(/{/g, '${')}\`, params });`;
    }
  }
  // 生成文件
  myTags.forEach((tag) => {
    fs.writeFile(
      `${projectAbsPath}/${tag.name}.ts`,
      contentTemplate + tag.content,
      (err) => {
        if (err) {
          console.log(`🚀🚀🚀 ~ fs.writeFile ~ err:`, err);
        }
      }
    );
  });
};

function activate(context) {
  // 注册命令
  let commandOfGetFileState = vscode.commands.registerCommand(
    'getFileState',
    (uri) => {
      // 文件路径
      const filePath = uri.path.substring(1);
      const projectAbsPath = filePath.split('/').slice(0, -1).join('/');
      fs.stat(filePath, (err, stats) => {
        if (err) {
          vscode.window.showErrorMessage(`获取文件时遇到错误了${err}!!!`);
        }

        if (stats.isDirectory()) {
          vscode.window.showWarningMessage(
            `检测的是文件夹，不是json文件，请重新选择！！！`
          );
        }

        // 判断是否是文件
        if (stats.isFile()) {
          const filename = filePath.split('/').pop();
          const isJsonFile = filename.split('.').pop() === 'json';
          // 判断是否是json文件
          if (isJsonFile) {
            fs.readFile(filePath, 'utf-8', (err, data) => {
              if (err) {
                vscode.window.showErrorMessage(`读取文件时遇到错误了${err}!!!`);
              }

              try {
                handleJson(data, projectAbsPath);
                vscode.window.showInformationMessage(
                  `文件处理成功，已生成对应的js文件！！！`
                );
              } catch (e) {
                vscode.window.showErrorMessage(
                  `json文件格式错误，请检查！！！`
                );
              }
            });
          } else {
            vscode.window.showWarningMessage(
              `检测到不是json文件，请重新选择！！！`
            );
          }
        }
      });
    }
  );

  // 将命令放入其上下文对象中，使其生效
  context.subscriptions.push(commandOfGetFileState);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
