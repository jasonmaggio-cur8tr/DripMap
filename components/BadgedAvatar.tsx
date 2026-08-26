import React from "react";

export interface AvatarBadge {
    emoji: string;
    name?: string;
}

interface BadgedAvatarProps {
    avatarUrl?: string | null;
    alt: string;
    /** Avatar diameter in px */
    size: number;
    /** Current month's reigning badge, if any */
    badge?: AvatarBadge | null;
    className?: string;
}

/**
 * Avatar with optional badge decoration (volt ring + emoji corner emblem).
 * The image is never modified — the badge is pure UI composition layered
 * around it, per the gamified-leaderboards proposal.
 */
const BadgedAvatar: React.FC<BadgedAvatarProps> = ({ avatarUrl, alt, size, badge, className }) => {
    // Emblem sized relative to avatar (~40% of diameter, min 16px)
    const emblemSize = Math.max(16, Math.round(size * 0.4));

    return (
        <div
            className={`relative flex-shrink-0 ${className || ""}`}
            style={{ width: size, height: size }}
            title={badge?.name}
        >
            <img
                src={avatarUrl || "https://via.placeholder.com/150"}
                alt={alt}
                className="h-full w-full rounded-full border border-white/[0.09] object-cover"
                style={
                    badge
                        ? { boxShadow: "0 0 0 2px #1e1712, 0 0 0 4px #a3e635" }
                        : undefined
                }
            />
            {badge && (
                <div
                    className="absolute flex items-center justify-center rounded-full"
                    style={{
                        width: emblemSize,
                        height: emblemSize,
                        right: -Math.round(emblemSize * 0.15),
                        bottom: -Math.round(emblemSize * 0.15),
                        background: "#2b221b",
                        border: "1.5px solid #a3e635",
                        fontSize: Math.round(emblemSize * 0.55),
                        lineHeight: 1,
                    }}
                    aria-label={badge.name}
                >
                    {badge.emoji}
                </div>
            )}
        </div>
    );
};

export default BadgedAvatar;
