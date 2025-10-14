"use client";

import clsx from "clsx";
import { RoleDefinition } from "../lib/roles";

interface RoleSelectorProps {
  roles: RoleDefinition[];
  activeRoleId: string;
  onRoleChange: (roleId: string) => void;
}

export const RoleSelector = ({ roles, activeRoleId, onRoleChange }: RoleSelectorProps) => {
  return (
    <div className="role-selector">
      {roles.map((role) => (
        <button
          key={role.id}
          type="button"
          className={clsx({ active: role.id === activeRoleId })}
          onClick={() => onRoleChange(role.id)}
          aria-label={role.description}
        >
          <span className="label">{role.label}</span>
          <span className="description">{role.description}</span>
        </button>
      ))}
    </div>
  );
};
