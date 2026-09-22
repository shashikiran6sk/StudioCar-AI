import { SocialLinkForm } from "../../../../features/admin/social-link-form";
import { toSocialLinkFields } from "../../../../features/admin/to-social-link-fields";
import { requireAdministrator } from "../../../../server/admin/require-administrator";
import {
  CONTENT_DESCRIPTION,
  CONTENT_EYEBROW,
  CONTENT_TITLE,
} from "../../../../server/content/content.constants";
import { getAllSocialLinks } from "../../../../server/content/get-social-links";
import { SOCIAL_PLATFORM_CATALOG } from "../../../../server/content/social-platform-catalog";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  await requireAdministrator();
  const configured = await getAllSocialLinks();

  return (
    <>
      <header className="app-page-header">
        <div>
          <p className="eyebrow">{CONTENT_EYEBROW}</p>
          <h1>{CONTENT_TITLE}</h1>
          <p>{CONTENT_DESCRIPTION}</p>
        </div>
      </header>
      <div className="admin-plan-grid">
        {SOCIAL_PLATFORM_CATALOG.map((presentation) => (
          <SocialLinkForm
            key={presentation.platform}
            link={toSocialLinkFields(presentation, configured)}
          />
        ))}
      </div>
    </>
  );
}
