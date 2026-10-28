import React from 'react';
import { ZcashCheckoutView, type ZcashCheckoutViewProps } from './ZcashCheckoutView';

export const ShieldCheckoutView: React.FC<ZcashCheckoutViewProps> = (props) => {
  return <ZcashCheckoutView {...props} />;
};
