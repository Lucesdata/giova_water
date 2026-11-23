import type { CheckResult, TracedValue } from '@eo/engineering-core';
import { component, type ComponentGeometry, type GeometryNode } from '@eo/geometry-engine';
import { designCircularTank, type CircularDesign, type DesignOptions } from '../primary-clarifier/definition/design.js';
import type { SizingDecisions } from '../primary-clarifier/definition/engine.js';
import type { DesignInput } from '../primary-clarifier/definition/schema.js';
import { CLF_CATALOG } from './components.js';
import { buildFlocculator, flocculatorConstructiveChecks, flocculatorGeometryChecks } from './flocculator.js';
import { CLF_PROFILES, engineCriteriaOf, resolveClfCriteria, type ClfProfile } from './profiles.js';
import { CLF_SCHEMA_VERSION, parseClfInput, type ClfInput } from './schema.js';
import { CLF_MODEL_VERSION, createClfStrategy } from './strategy.js';

export type ClfDecisions = SizingDecisions & { readonly paddleRings: number };
export type ClariflocculatorDesign = CircularDesign<ClfInput, ClfProfile, ClfDecisions>;

/**
 * Adapta la entrada del clarifloculador al motor circular común. La cámara de floculación ocupa el
 * lugar del pozo de alimentación (`feedwell*`); su diámetro lo decide la estrategia, no la proporción.
 */
export function toCircularInput(c: ClfInput): DesignInput {
  return {
    tag: c.tag,
    name: c.name,
    profileId: 'project-criteria',
    flow: c.flow,
    influent: { tssMgL: c.influent.tssMgL, temperatureC: c.influent.temperatureC ?? c.flocculation.designTemperatureC },
    designCriteria: {
      surfaceLoadingAvgM_h: c.designCriteria.settlingLoadingAvgM_h,
      surfaceLoadingPeakM_h: c.designCriteria.settlingLoadingPeakM_h,
      hrtTargetMinH: c.designCriteria.hrtTargetMinH,
      weirLoadingMaxM3_md: c.designCriteria.weirLoadingMaxM3_md,
    },
    criteriaOverrides: {},
    geometry: { ...c.geometry, excludeFeedwellFromEffectiveVolume: true },
    civil: c.civil,
    hydraulics: {
      ...c.hydraulics,
      // No intervienen: la estrategia dimensiona la cámara. Valores neutros válidos para el esquema común.
      feedwellDiameterRatio: 0.2,
      feedwellMinDiameterM: 0,
      feedwellDepthM: c.flocculation.chamberDepthM,
      feedwellPlateThicknessM: c.flocculation.chamberWallThicknessM,
    },
    mechanical: c.mechanical,
    site: c.site,
    meshResolution: c.meshResolution,
  };
}

/** Terminología: en el clarifloculador la zona central es la cámara de floculación. */
export function relabel(s: string): string {
  return s
    .replace(/\bdel pozo de alimentación/g, 'de la cámara de floculación')
    .replace(/\bal pozo de alimentación/g, 'a la cámara de floculación')
    .replace(/\bEl pozo de alimentación/g, 'La cámara de floculación')
    .replace(/\bel pozo de alimentación/g, 'la cámara de floculación')
    .replace(/pozo de alimentación/g, 'cámara de floculación')
    .replace(/Pozo de alimentación/g, 'Cámara de floculación')
    .replace(/Pozo y deflector/g, 'Cámara y deflector')
    .replace(/\bdel pozo\b/g, 'de la cámara')
    .replace(/\ben el pozo\b/g, 'en la cámara')
    .replace(/\bel pozo\b/g, 'la cámara');
}

function relabelNode(n: GeometryNode, material: (n: GeometryNode) => string): GeometryNode {
  return { ...n, label: relabel(n.label), materialId: material(n), children: n.children.map((c) => relabelNode(c, material)) };
}

/** Diseño del clarifloculador: el pipeline circular común con su estrategia y su agitador. */
export function designClariflocculator(rawInput: unknown, options: DesignOptions = {}): ClariflocculatorDesign {
  const clf = parseClfInput(rawInput);
  const criteria = resolveClfCriteria(clf);
  const fixed = options.fixed ?? {};
  const { paddleRings, ...engineFixed } = fixed as Partial<ClfDecisions>;
  const st = createClfStrategy(clf, criteria, paddleRings);
  const chamberMaterial = clf.flocculation.materials.chamber;

  const design = designCircularTank<ClfInput, ClfProfile, ClfDecisions>(
    {
      input: clf,
      circularInput: toCircularInput(clf),
      profile: CLF_PROFILES[clf.profileId],
      criteria,
      engineCriteria: engineCriteriaOf(criteria),
      overrides: clf.criteriaOverrides,
      schemaVersion: CLF_SCHEMA_VERSION,
      modelVersion: CLF_MODEL_VERSION,
      strategy: st.strategy,
      catalog: CLF_CATALOG,
      extraDecisions: () => st.decisions(),
      buildGeometry: (common, model) => {
        const renamed: ComponentGeometry[] = common.map((cg) =>
          cg.componentId === 'HYD-002' || cg.componentId === 'HYD-003' || cg.componentId === 'MEC-001'
            ? component(
                cg.componentId,
                relabelNode(cg.root, (n) => (n.id === 'HYD-002.shell' ? chamberMaterial : n.materialId)),
                cg.connections.map((p) => ({ ...p, description: relabel(p.description) })),
              )
            : cg,
        );
        return [...renamed, ...buildFlocculator(model, st.layout(), clf)];
      },
      extraGeometryChecks: (model, assembly, checks) => flocculatorGeometryChecks(model, st.layout(), clf, assembly, checks),
      extraConstructiveChecks: (_model, checks) => flocculatorConstructiveChecks(checks, st.powerDelivered()),
      extraSources: () => st.sourcesUsed(),
    },
    { ...options, fixed: engineFixed },
  );

  const checks: CheckResult[] = design.checks.map((c) => ({ ...c, title: relabel(c.title), message: relabel(c.message) }));
  const values: Record<string, TracedValue> = Object.fromEntries(Object.entries(design.values).map(([k, v]) => [k, { ...v, label: relabel(v.label) }]));
  return { ...design, checks, values };
}

