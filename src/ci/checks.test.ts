// Los checks que exige el ruleset de main deben existir como jobs del CI.
// Si alguien renombra un job, este test falla en su PR, antes de que el
// ruleset bloquee todos los merges esperando un check que ya no existe.

import { describe, expect, it } from 'vitest';
import ruleset from '../../.github/rulesets/main.json' with { type: 'json' };
import workflow from '../../.github/workflows/deploy.yml?raw';

/** ID de la app "GitHub Actions": el check debe venir del CI, no de otro lado. */
const GITHUB_ACTIONS = 15368;

/** Nombres de check que publica un workflow: el `name:` del job o, si no tiene, su id. */
function nombresDeJobs(yml: string): Set<string> {
  const jobs = yml.split(/^jobs:\s*$/m)[1] ?? '';
  const nombres = new Set<string>();
  // Cada job empieza con su id a dos espacios; su `name:`, si tiene, va a cuatro.
  for (const bloque of jobs.split(/^(?= {2}[\w-]+:\s*$)/m)) {
    const id = bloque.match(/^ {2}([\w-]+):\s*$/m)?.[1];
    if (!id) continue;
    nombres.add(bloque.match(/^ {4}name:\s*(.+?)\s*$/m)?.[1] ?? id);
  }
  return nombres;
}

const checks = ruleset.rules.find((r) => r.type === 'required_status_checks')?.parameters;

describe('nombresDeJobs', () => {
  it('usa el name del job y, si no hay, su id', () => {
    const yml = [
      'on: push',
      'jobs:',
      '  # comentario',
      '  pruebas:',
      '    name: tests',
      '    steps:',
      '      - name: no cuenta',
      '  build:',
      '    runs-on: ubuntu-latest',
    ].join('\n');
    expect(nombresDeJobs(yml)).toEqual(new Set(['tests', 'build']));
  });
});

describe('ruleset de main', () => {
  it('exige tests y build, con la rama al día', () => {
    expect(checks?.required_status_checks.map((c) => c.context)).toEqual(['tests', 'build']);
    expect(checks?.strict_required_status_checks_policy).toBe(true);
  });

  it('cada check exigido existe como job en deploy.yml', () => {
    const jobs = nombresDeJobs(workflow);
    for (const { context } of checks?.required_status_checks ?? []) {
      expect(jobs, `falta el job "${context}" en deploy.yml`).toContain(context);
    }
  });

  it('los checks deben venir de GitHub Actions', () => {
    for (const check of checks?.required_status_checks ?? []) {
      expect(check.integration_id).toBe(GITHUB_ACTIONS);
    }
  });

  it('solo las deploy keys se saltan la regla', () => {
    expect(ruleset.bypass_actors).toEqual([{ actor_id: null, actor_type: 'DeployKey', bypass_mode: 'always' }]);
  });
});
