#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { table } from 'table';
import ora from 'ora';
import moment from 'moment';
import path from 'path';
import fs from 'fs';

const program = new Command();

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  metadata?: Record<string, any>;
}

const LOG_LEVELS: Record<string, chalk.Chalk> = {
  error: chalk.red,
  warn: chalk.yellow,
  info: chalk.blue,
  debug: chalk.green,
  verbose: chalk.gray
};

const formatLogEntry = (entry: LogEntry): string[] => {
  return [
    chalk.gray(moment(entry.timestamp).format('YYYY-MM-DD HH:mm:ss')),
    LOG_LEVELS[entry.level.toLowerCase()](entry.level.toUpperCase()),
    entry.message,
    entry.metadata ? chalk.gray(JSON.stringify(entry.metadata)) : ''
  ];
};

const readLogs = async (logPath: string, options: { tail?: number; filter?: string; level?: string }) => {
  const spinner = ora('Reading logs...').start();
  
  try {
    if (!fs.existsSync(logPath)) {
      spinner.fail(`Log file not found: ${logPath}`);
      console.log(chalk.yellow('\nAvailable log files:'));
      const availableLogs = findLogFiles();
      if (availableLogs.length > 0) {
        availableLogs.forEach(log => console.log(chalk.blue(`- ${log.name}`)));
      } else {
        console.log(chalk.gray('No log files found in ./logs directory'));
      }
      process.exit(1);
    }

    const logContent = fs.readFileSync(logPath, 'utf-8');
    const logs: LogEntry[] = logContent
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line));

    let filteredLogs = logs;

    if (options.level) {
      const level = options.level.toLowerCase();
      filteredLogs = filteredLogs.filter(log => log.level.toLowerCase() === level);
    }

    if (options.filter) {
      const filterRegex = new RegExp(options.filter, 'i');
      filteredLogs = filteredLogs.filter(log => 
        filterRegex.test(log.message) || 
        filterRegex.test(JSON.stringify(log.metadata))
      );
    }

    if (options.tail) {
      filteredLogs = filteredLogs.slice(-options.tail);
    }

    spinner.succeed('Logs loaded successfully');

    const tableConfig = {
      border: {
        topBody: chalk.gray('─'),
        topJoin: chalk.gray('┬'),
        topLeft: chalk.gray('┌'),
        topRight: chalk.gray('┐'),
        bottomBody: chalk.gray('─'),
        bottomJoin: chalk.gray('┴'),
        bottomLeft: chalk.gray('└'),
        bottomRight: chalk.gray('┘'),
        bodyLeft: chalk.gray('│'),
        bodyRight: chalk.gray('│'),
        bodyJoin: chalk.gray('│'),
        joinBody: chalk.gray('─'),
        joinLeft: chalk.gray('├'),
        joinRight: chalk.gray('┤'),
        joinJoin: chalk.gray('┼')
      }
    };

    const headers = ['Timestamp', 'Level', 'Message', 'Metadata'];
    const data = filteredLogs.map(formatLogEntry);
    
    console.log(table([headers, ...data], tableConfig));
    console.log(chalk.gray(`Showing ${filteredLogs.length} log entries`));

  } catch (error: unknown) {
    spinner.fail('Failed to read logs');
    if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
    } else {
      console.error(chalk.red('An unknown error occurred'));
    }
    process.exit(1);
  }
};

interface LogFile {
  name: string;
  value: string;
}

const findLogFiles = (directory: string = './logs'): LogFile[] => {
  try {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
      return [];
    }
    
    const files = fs.readdirSync(directory)
      .filter(file => file.endsWith('.log') || file.match(/^[\da-f]{32}$/i))
      .map(file => ({
        name: file,
        path: path.join(directory, file),
        stats: fs.statSync(path.join(directory, file))
      }))
      .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime())
      .map(file => ({
        name: `${file.name} (${moment(file.stats.mtime).format('YYYY-MM-DD HH:mm:ss')})`,
        value: file.path
      }));

    return files;
  } catch (error) {
    console.error(chalk.yellow(`Warning: Could not read directory ${directory}`));
    return [];
  }
};

const interactiveMode = async () => {
  const logFiles = findLogFiles();
  const defaultPath = './logs/';
  
  const fileChoices = [
    new inquirer.Separator('Available log files:'),
    ...(logFiles.length > 0 
      ? logFiles
      : [{ name: defaultPath + ' (will be created)', value: defaultPath }]
    )
  ];

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'logPath',
      message: 'Select a log file:',
      pageSize: 15,
      choices: fileChoices
    },
    {
      type: 'list',
      name: 'level',
      message: 'Select log level to filter:',
      choices: ['all', ...Object.keys(LOG_LEVELS)]
    },
    {
      type: 'input',
      name: 'filter',
      message: 'Enter text to filter logs (optional):',
    },
    {
      type: 'number',
      name: 'tail',
      message: 'Number of latest logs to show (0 for all):',
      default: 0
    }
  ]);

  const options = {
    level: answers.level === 'all' ? undefined : answers.level,
    filter: answers.filter || undefined,
    tail: answers.tail || undefined
  };

  await readLogs(answers.logPath, options);
};

program
  .name('loglog')
  .description('A powerful command-line interface for viewing and analyzing logs')
  .version('1.0.0');

program
  .command('view')
  .description('View logs with optional filtering')
  .argument('[logPath]', 'Path to the log file')
  .option('-l, --level <level>', 'Filter by log level')
  .option('-f, --filter <pattern>', 'Filter logs by pattern')
  .option('-t, --tail <number>', 'Show only the last N entries')
  .option('-i, --interactive', 'Start interactive mode')
  .action(async (logPath, options) => {
    if (options.interactive) {
      await interactiveMode();
      return;
    }

    const resolvedPath = logPath;
    await readLogs(resolvedPath, {
      level: options.level,
      filter: options.filter,
      tail: options.tail ? parseInt(options.tail) : undefined
    });
  });

program.parse();