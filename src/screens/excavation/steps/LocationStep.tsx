import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import type { GeoPoint } from '@/domain';
import { Button, Input, Select } from '@/design-system';
import { LAND_TYPES, type ApplicationDraft } from '@/rules';
import { locationRepository, useAsync, type ResolvedLocation } from '@/data';
import { useCopy } from '@/content';
import { LocationMapOverlay } from '../LocationMapOverlay';
import type { StepProps } from './ApplicantStep';

export interface LocationStepProps extends StepProps {
  patch: (values: Partial<ApplicationDraft>) => void;
}

/** Centre of Maharashtra — where the map opens before a district is chosen. */
const STATE_CENTRE: GeoPoint = { latitude: 19.7515, longitude: 75.7139 };

/**
 * STEP 3 · WHERE THE QUARRY IS.
 *
 * Two ways to answer the same question, and they feed each other:
 *
 *   DROPDOWNS  district → taluka → village, the cascade every land record uses
 *   THE MAP    drop a pin and the cascade is filled in FROM it
 *
 * The map is not decoration next to the address fields — it is a second, often
 * faster, way in. An applicant standing on the site taps "use my location" and
 * the district, taluka and village are resolved for them; one filling this in
 * at the office picks the units and then marks the exact pit.
 *
 * A resolved suggestion is applied automatically only while the cascade is
 * still empty. Once the applicant has chosen units themselves, a pin that
 * disagrees offers a suggestion instead of overwriting them — the nearest
 * centroid is an approximation and the applicant may well be right.
 */
export function LocationStep({ draft, errors, update, patch }: LocationStepProps) {
  const t = useCopy();
  const [suggestion, setSuggestion] = useState<ResolvedLocation | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapPoint, setMapPoint] = useState<GeoPoint | null>(draft.siteGeo);

  const districts = useAsync(() => locationRepository.listDistricts(), []);
  const talukas = useAsync(
    () => (draft.districtCode ? locationRepository.listTalukas(draft.districtCode) : Promise.resolve([])),
    [draft.districtCode],
  );
  const villages = useAsync(
    () => (draft.talukaCode ? locationRepository.listVillages(draft.talukaCode) : Promise.resolve([])),
    [draft.talukaCode],
  );

  /* Resolve every dropped pin, then either fill the cascade or offer to. */
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
    // `patch` is stable enough for this effect; re-running on it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin?.latitude, pin?.longitude, hasSelection, draft.villageCode]);

  /* The map frames the narrowest unit chosen so far. */
  const selectedTaluka = talukas.data?.find((taluka) => taluka.code === draft.talukaCode);
  const selectedDistrict = districts.data?.find((district) => district.code === draft.districtCode);
  const centre = selectedTaluka?.geo ?? selectedDistrict?.geo ?? STATE_CENTRE;


  return (
    <div className="space-y-4">
      <Select
        label={t.excavation.district}
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
          // Changing a level clears every level below it, or the address lies.
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

      <Select
        label={t.excavation.taluka}
        required
        disabled={!draft.districtCode}
        placeholder={draft.districtCode ? 'Select a taluka' : 'Select a district first'}
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
        label={t.excavation.village}
        required
        disabled={!draft.talukaCode}
        placeholder={draft.talukaCode ? 'Select a village' : 'Select a taluka first'}
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

      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t.excavation.surveyNumber}
          required
          placeholder="118/2"
          value={draft.surveyNumber}
          {...(errors.surveyNumber ? { error: errors.surveyNumber } : {})}
          onChange={(event) => update('surveyNumber', event.target.value)}
        />
        <Input
          label={t.excavation.subDivisionNumber}
          value={draft.subDivisionNumber}
          onChange={(event) => update('subDivisionNumber', event.target.value)}
        />
      </div>

      <Select
        label={t.excavation.landType}
        required
        placeholder="Select the land type"
        value={draft.landType}
        options={LAND_TYPES.map((type) => ({
          value: type,
          label: t.excavation.landTypes[type],
        }))}
        {...(errors.landType ? { error: errors.landType } : {})}
        onChange={(event) => update('landType', event.target.value as ApplicationDraft['landType'])}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label={`${t.excavation.area} (sq m)`}
          required
          inputMode="decimal"
          value={draft.areaInSqm ?? ''}
          {...(errors.areaInSqm ? { error: errors.areaInSqm } : {})}
          onChange={(event) =>
            update('areaInSqm', event.target.value ? Number(event.target.value) : null)
          }
        />
        <Input
          label={t.excavation.pincode}
          required
          inputMode="numeric"
          maxLength={6}
          value={draft.pincode}
          {...(errors.pincode ? { error: errors.pincode } : {})}
          onChange={(event) =>
            update('pincode', event.target.value.replace(/\D/g, '').slice(0, 6))
          }
        />
      </div>

      <Input
        label={t.excavation.siteAddressLabel}
        required
        placeholder="Survey No. 118/2, near the village road"
        value={draft.addressLine}
        {...(errors.addressLine ? { error: errors.addressLine } : {})}
        onChange={(event) => update('addressLine', event.target.value)}
        rightSlot={
          <button
            type="button"
            aria-label="Choose site address on map"
            onClick={() => {
              setMapPoint(draft.siteGeo ?? centre);
              setMapOpen(true);
            }}
            className="flex size-8 items-center justify-center rounded-full text-primary-700 hover:bg-primary-50"
          >
            <MapPin size={18} aria-hidden />
          </button>
        }
      />

      {mapOpen && (
        <LocationMapOverlay
          centre={centre}
          value={mapPoint}
          onChange={setMapPoint}
          onClose={() => setMapOpen(false)}
          onSave={(point) => {
            update('siteGeo', point);
            update(
              'addressLine',
              `Pinned site location (${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)})`,
            );
            setMapOpen(false);
          }}
        />
      )}

      {/* The pin disagrees with the chosen units — say so, do not overrule. */}
      {suggestion?.village && suggestion.taluka && suggestion.district && (
        <div className="rounded-lg border border-primary-200 bg-primary-50/60 p-3">
          <p className="flex items-start gap-2 text-body-sm text-ink">
            <MapPin size={15} className="mt-0.5 shrink-0 text-primary-600" aria-hidden />
            <span>
              <span className="block text-caption text-ink-muted">
                {t.excavation.suggestedFromPin}
              </span>
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
              {t.excavation.applySuggestion}
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
