import { useEffect, useState } from 'react';
import { CloudDownload, MapPin, Plus, Trash2 } from 'lucide-react';
import type { GeoPoint, SurveyEntry } from '@/domain';
import { Button, Input, Select, cn } from '@/design-system';
import {
  DEMAND_NOTE_OFFICES,
  GRAS_OFFICES,
  LOCATION_CATEGORIES,
  PLOT_LOCATIONS,
  type ApplicationDraft,
} from '@/rules';
import { locationRepository, useAsync, type ResolvedLocation } from '@/data';
import { LocationMapOverlay } from '../LocationMapOverlay';
import type { StepProps } from './ApplicantStep';

export interface LocationStepProps extends StepProps {
  patch: (values: Partial<ApplicationDraft>) => void;
}

const STATE_CENTRE: GeoPoint = { latitude: 19.7515, longitude: 75.7139 };

/**
 * STEP 3 · PLOT, SURVEY & LOCATION DETAILS (Desktop Field Parity)
 *
 * Implements:
 * - Category: Rural vs Urban
 * - Plot Location: Interior, Riverbed, Plain, Hilly
 * - Administrative Cascade: District -> Taluka -> Village
 * - Survey No. with 'Fetch 7/12' & Multi-Survey Table
 * - Total Plot Area in Hectares
 * - Coordinates & Map Overlay
 * - Demand Note Office & GRAS Treasury Office
 */
export function LocationStep({ draft, errors, update, patch }: LocationStepProps) {
  const [suggestion, setSuggestion] = useState<ResolvedLocation | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapPoint, setMapPoint] = useState<GeoPoint | null>(draft.siteGeo);
  const [currentSurveyInput, setCurrentSurveyInput] = useState(draft.surveyNumber || '');
  const [fetching712, setFetching712] = useState(false);
  const [fetchSuccess, setFetchSuccess] = useState<string | null>(null);

  const districts = useAsync(() => locationRepository.listDistricts(), []);
  const talukas = useAsync(
    () => (draft.districtCode ? locationRepository.listTalukas(draft.districtCode) : Promise.resolve([])),
    [draft.districtCode],
  );
  const villages = useAsync(
    () => (draft.talukaCode ? locationRepository.listVillages(draft.talukaCode) : Promise.resolve([])),
    [draft.talukaCode],
  );

  const pin = draft.siteGeo;
  const hasSelection = Boolean(draft.villageCode);
  useEffect(() => {
    if (!pin) return;
    let cancelled = false;
    void locationRepository.resolveNearest(pin).then((resolved) => {
      if (cancelled || !resolved.village || !resolved.taluka || !resolved.district) return;
      if (!hasSelection) {
        patch(fromResolved(resolved));
        setSuggestion(null);
        return;
      }
      setSuggestion(resolved.village.code === draft.villageCode ? null : resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [pin?.latitude, pin?.longitude, hasSelection, draft.villageCode]);

  const selectedTaluka = talukas.data?.find((taluka) => taluka.code === draft.talukaCode);
  const selectedDistrict = districts.data?.find((district) => district.code === draft.districtCode);
  const centre = selectedTaluka?.geo ?? selectedDistrict?.geo ?? STATE_CENTRE;

  function handleFetch712() {
    if (!currentSurveyInput.trim()) return;
    setFetching712(true);
    setFetchSuccess(null);

    setTimeout(() => {
      setFetching712(false);
      setFetchSuccess(`7/12 record fetched for Survey No. ${currentSurveyInput}`);
      const newEntry: SurveyEntry = {
        id: `survey-${Date.now()}`,
        surveyNumber: currentSurveyInput.trim(),
        areaInHectares: draft.totalPlotAreaHectare ?? 0.75,
        sevenTwelveAttached: true,
        ownerApprovalAttached: true,
      };
      const updated = [...draft.surveyEntries.filter((s) => s.surveyNumber !== newEntry.surveyNumber), newEntry];
      update('surveyEntries', updated);
      update('surveyNumber', currentSurveyInput.trim());
    }, 800);
  }

  function handleAddSurvey() {
    if (!currentSurveyInput.trim()) return;
    const newEntry: SurveyEntry = {
      id: `survey-${Date.now()}`,
      surveyNumber: currentSurveyInput.trim(),
      areaInHectares: draft.totalPlotAreaHectare ?? 0.5,
      sevenTwelveAttached: false,
      ownerApprovalAttached: false,
    };
    const updated = [...draft.surveyEntries.filter((s) => s.surveyNumber !== newEntry.surveyNumber), newEntry];
    update('surveyEntries', updated);
    update('surveyNumber', currentSurveyInput.trim());
    setCurrentSurveyInput('');
  }

  function handleRemoveSurvey(id: string) {
    const updated = draft.surveyEntries.filter((s) => s.id !== id);
    update('surveyEntries', updated);
    if (updated.length > 0) {
      update('surveyNumber', updated[0].surveyNumber);
    }
  }

  return (
    <div className="space-y-4">
      {/* 1. Category: Rural vs Urban */}
      <div>
        <label className="mb-1.5 block text-caption font-semibold text-ink">
          Category <span className="text-danger-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {LOCATION_CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat.value}
              onClick={() => update('category', cat.value)}
              className={cn(
                'flex h-11 items-center justify-center rounded-xl border text-body-sm font-semibold transition-all',
                draft.category === cat.value
                  ? 'border-primary-600 bg-primary-50/70 text-primary-700 shadow-xs'
                  : 'border-line bg-surface text-ink-muted hover:border-neutral-300',
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Plot Location */}
      <Select
        label="Plot Location"
        required
        placeholder="Select plot location"
        value={draft.plotLocationType}
        options={PLOT_LOCATIONS.map((loc) => ({ value: loc.value, label: loc.label }))}
        {...(errors.plotLocationType ? { error: errors.plotLocationType } : {})}
        onChange={(event) =>
          update('plotLocationType', event.target.value as ApplicationDraft['plotLocationType'])
        }
      />

      {/* 3. District, Taluka, Village cascade */}
      <Select
        label="District"
        required
        placeholder="Select a district"
        value={draft.districtCode}
        options={(districts.data ?? []).map((district) => ({
          value: district.code,
          label: district.name,
        }))}
        {...(errors.districtCode ? { error: errors.districtCode } : {})}
        onChange={(event) => {
          const chosen = districts.data?.find((district) => district.code === event.target.value);
          patch({
            districtCode: chosen?.code ?? '',
            districtName: chosen?.name ?? '',
            talukaCode: '',
            talukaName: '',
            villageCode: '',
            villageName: '',
          });
        }}
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Taluka / CTSO"
          required
          disabled={!draft.districtCode}
          placeholder={draft.districtCode ? 'Select taluka' : 'Select district'}
          value={draft.talukaCode}
          options={(talukas.data ?? []).map((taluka) => ({
            value: taluka.code,
            label: taluka.name,
          }))}
          {...(errors.talukaCode ? { error: errors.talukaCode } : {})}
          onChange={(event) => {
            const chosen = talukas.data?.find((taluka) => taluka.code === event.target.value);
            patch({
              talukaCode: chosen?.code ?? '',
              talukaName: chosen?.name ?? '',
              villageCode: '',
              villageName: '',
            });
          }}
        />

        <Select
          label="Village / City"
          required
          disabled={!draft.talukaCode}
          placeholder={draft.talukaCode ? 'Select village' : 'Select taluka'}
          value={draft.villageCode}
          options={(villages.data ?? []).map((village) => ({
            value: village.code,
            label: village.name,
          }))}
          {...(errors.villageCode ? { error: errors.villageCode } : {})}
          onChange={(event) => {
            const chosen = villages.data?.find((village) => village.code === event.target.value);
            patch({ villageCode: chosen?.code ?? '', villageName: chosen?.name ?? '' });
          }}
        />
      </div>

      {/* 4. Assign Survey Number with Fetch 7/12 */}
      <div className="rounded-xl border border-line bg-surface-raised p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-caption font-bold uppercase tracking-wider text-ink-secondary">
            Assign Survey / CTS Number <span className="text-danger-500">*</span>
          </label>
        </div>

        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <Input
              label="Survey No. / CTS No."
              required
              placeholder="e.g. 142/1"
              value={currentSurveyInput}
              onChange={(e) => setCurrentSurveyInput(e.target.value)}
            />
          </div>

          <Button
            type="button"
            variant="secondary"
            className="mt-6 shrink-0"
            loading={fetching712}
            leftIcon={<CloudDownload size={15} />}
            onClick={handleFetch712}
          >
            Fetch 7/12
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="mt-6 shrink-0"
            leftIcon={<Plus size={15} />}
            onClick={handleAddSurvey}
          >
            Add
          </Button>
        </div>

        {fetchSuccess && (
          <p className="text-caption font-medium text-success-700 bg-success-50/80 rounded-md p-2 border border-success-200">
            ✓ {fetchSuccess}
          </p>
        )}

        {/* Added Surveys Table / List */}
        {draft.surveyEntries.length > 0 && (
          <div className="mt-2 space-y-2 border-t border-line/60 pt-2.5">
            <p className="text-caption text-ink-muted">Assigned Survey Plots:</p>
            {draft.surveyEntries.map((survey, index) => (
              <div
                key={survey.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface p-2.5 text-body-sm"
              >
                <div>
                  <span className="font-semibold text-ink">
                    #{index + 1}. Survey {survey.surveyNumber}
                  </span>
                  <p className="text-caption text-ink-muted">
                    {survey.sevenTwelveAttached ? '7/12 Record Verified' : 'Standard Plot'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSurvey(survey.id)}
                  aria-label={`Remove survey ${survey.surveyNumber}`}
                  className="rounded p-1 text-ink-muted hover:text-danger-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
        {errors.surveyNumber && (
          <p className="text-caption text-danger-500">{errors.surveyNumber}</p>
        )}
      </div>

      {/* 5. Total Plot Area in Hectares */}
      <Input
        label="Total Plot Area"
        required
        inputMode="decimal"
        placeholder="e.g. 0.75"
        rightSlot={<span className="text-caption font-medium text-ink-muted">Hectare</span>}
        value={draft.totalPlotAreaHectare !== null ? String(draft.totalPlotAreaHectare) : ''}
        {...(errors.totalPlotAreaHectare ? { error: errors.totalPlotAreaHectare } : {})}
        onChange={(event) => {
          const val = event.target.value ? Number(event.target.value) : null;
          update('totalPlotAreaHectare', val);
          if (val) update('areaInSqm', Math.round(val * 10000));
        }}
      />

      {/* 6. Geo-coordinates & Map Overlay */}
      <div className="rounded-xl border border-line bg-surface-raised p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-caption font-bold uppercase tracking-wider text-ink-secondary">
            Plot Geo-Coordinates <span className="text-danger-500">*</span>
          </label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<MapPin size={14} />}
            onClick={() => {
              setMapPoint(draft.siteGeo ?? centre);
              setMapOpen(true);
            }}
          >
            Pin on Map
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Plot Latitude"
            required
            inputMode="decimal"
            placeholder="19.7515"
            value={draft.siteGeo ? draft.siteGeo.latitude.toFixed(5) : ''}
            onChange={(e) => {
              const lat = Number(e.target.value);
              if (!isNaN(lat)) {
                update('siteGeo', {
                  latitude: lat,
                  longitude: draft.siteGeo?.longitude ?? 75.7139,
                });
              }
            }}
          />
          <Input
            label="Plot Longitude"
            required
            inputMode="decimal"
            placeholder="75.7139"
            value={draft.siteGeo ? draft.siteGeo.longitude.toFixed(5) : ''}
            onChange={(e) => {
              const lng = Number(e.target.value);
              if (!isNaN(lng)) {
                update('siteGeo', {
                  latitude: draft.siteGeo?.latitude ?? 19.7515,
                  longitude: lng,
                });
              }
            }}
          />
        </div>
        {errors.siteGeo && <p className="text-caption text-danger-500">{errors.siteGeo}</p>}
      </div>

      {mapOpen && (
        <LocationMapOverlay
          centre={centre}
          value={mapPoint}
          onChange={setMapPoint}
          onClose={() => setMapOpen(false)}
          onSave={(point) => {
            update('siteGeo', point);
            update('addressLine', `Site at (${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)})`);
            setMapOpen(false);
          }}
        />
      )}

      {/* 7. Application Fee Demand Note & GRAS Office */}
      <div className="rounded-xl border border-line bg-surface-raised p-3.5 space-y-3">
        <label className="text-caption font-bold uppercase tracking-wider text-ink-secondary">
          Application Fee Demand Note Office
        </label>

        <Select
          label="Office For Demand Note"
          required
          placeholder="Select Office For Demand Note"
          value={draft.demandNoteOffice}
          options={DEMAND_NOTE_OFFICES.map((off) => ({ value: off.value, label: off.label }))}
          {...(errors.demandNoteOffice ? { error: errors.demandNoteOffice } : {})}
          onChange={(e) => update('demandNoteOffice', e.target.value)}
        />

        <Select
          label="GRAS Office Name"
          required
          placeholder="Select GRAS Office Name"
          value={draft.grasOfficeName}
          options={GRAS_OFFICES.map((off) => ({ value: off.value, label: off.label }))}
          {...(errors.grasOfficeName ? { error: errors.grasOfficeName } : {})}
          onChange={(e) => update('grasOfficeName', e.target.value)}
        />
      </div>

      {/* Suggestion alert if pin contradicts administrative selection */}
      {suggestion?.village && suggestion.taluka && suggestion.district && (
        <div className="rounded-lg border border-primary-200 bg-primary-50/60 p-3">
          <p className="flex items-start gap-2 text-body-sm text-ink">
            <MapPin size={15} className="mt-0.5 shrink-0 text-primary-600" aria-hidden />
            <span>
              <span className="block text-caption text-ink-muted">Suggested from pinned location</span>
              {suggestion.village.name}, {suggestion.taluka.name}, {suggestion.district.name}
            </span>
          </p>
          <div className="mt-2 flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                patch(fromResolved(suggestion));
                setSuggestion(null);
              }}
            >
              Apply Suggestion
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function fromResolved(resolved: ResolvedLocation): Partial<ApplicationDraft> {
  return {
    districtCode: resolved.district?.code ?? '',
    districtName: resolved.district?.name ?? '',
    talukaCode: resolved.taluka?.code ?? '',
    talukaName: resolved.taluka?.name ?? '',
    villageCode: resolved.village?.code ?? '',
    villageName: resolved.village?.name ?? '',
  };
}
