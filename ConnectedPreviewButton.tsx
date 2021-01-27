import React, { useRef, useState } from 'react';
import { getSnapshot } from 'mobx-state-tree';
import { observer, useLocalStore } from 'mobx-react';
import styled from 'styled-components';
import {
  Button,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from '@greatminds/dp-core-ui-lib';
import { Manager, Reference, Popper } from 'react-popper';
import getConfig from 'next/config';

import Icon from '~/components/shared/Icon';
import { useLessonStore } from '~/stores/lessonStore';
import ClassroomPreviewStore from '~/stores/classroomPreviewStore';
import NotificationStore from '~/stores/notificationStore';
import api from '~/services/api';

import { postProcessSlide } from '~/stores/snapshotsProccessors/postProcessSlides/postProcessSlides.ts';

import ClassroomPreview from './ClassroomPreview';

const { publicRuntimeConfig } = getConfig();

const PreviewButtonStyled = styled(Button)`
  height: 35px;
  margin: 0 0 0 24px;
`;

const PreviewButtonToggle = styled(DropdownToggle)`
  &&& {
    height: 35px;
    width: 35px;
    margin: 0 24px 0 1px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const PreviewDropdownMenu = styled(DropdownMenu)`
  &&& {
    min-width: 129px;
    left: -95px;
    box-shadow: 0 4px 4px ${props => props.theme.colors.grays[1]};
    border: none;
    border-radius: 0 0 5px 5px;
    padding: 0;
  }
`;

const PreviewDropdownItem = styled(DropdownItem)`
  &&& {
    font-family: ${props => props.theme.fonts.text};
    font-size: 14px;
    padding: 8px 14px;
    color: #1f2226;
    &:hover {
      background: #edeff2;
    }
  }
`;

const ConnectedPreviewButton: React.FC = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const lessonStore = useLessonStore();
  const classroomPreviewStore = useLocalStore(
    () => new ClassroomPreviewStore(lessonStore.id, 3, api, NotificationStore),
  );
  const previewConfig = {
    playerConfig: {
      startFromSlide: lessonStore.selectedSlideIndex,
    },
  };
  const [isPreviewOptionsOpen, setIsPreviewOptionsOpen] = useState<boolean>(false);
  const [isClassroomPreviewOpen, setIsClassroomPreviewOpen] = useState<boolean>(false);

  // TODO: prevent this to be called in every render
  const lessonSnapshot = postProcessSlide(lessonStore.slides[0]);
  const dataSerialized = JSON.stringify({ ...lessonSnapshot, ...previewConfig });

  function handleClick() {
    formRef.current.submit();
  }

  function handleDropdownOpen() {
    if (!isClassroomPreviewOpen) {
      setIsPreviewOptionsOpen(!isPreviewOptionsOpen);
    } else {
      setIsClassroomPreviewOpen(false);
    }
  }

  function handleClassroomPreviewCloseClick() {
    setIsClassroomPreviewOpen(false);
  }

  function handleClassRoomPreviewClick() {
    if (!isClassroomPreviewOpen) {
      setIsClassroomPreviewOpen(true);
      setIsPreviewOptionsOpen(false);
    }
  }

  return (
    <React.Fragment>
      <Manager>
        <PreviewButtonStyled color="primary" outline={true} onClick={handleClick}>
          <Reference>{({ ref }) => <span ref={ref}>Preview</span>}</Reference>
        </PreviewButtonStyled>
        {isClassroomPreviewOpen && (
          <Popper
            modifiers={{
              offset: {
                enabled: true,
                offset: '90px,9px',
              },
              preventOverflow: { enabled: true },
              hide: { enabled: true },
            }}
          >
            {({ ref, style, placement }) => (
              <div ref={ref} style={style} data-placement={placement}>
                <ClassroomPreview
                  onCloseClick={handleClassroomPreviewCloseClick}
                  classroomPreviewStore={classroomPreviewStore}
                  lessonSerialized={dataSerialized}
                  lessonId={lessonStore.id}
                />
              </div>
            )}
          </Popper>
        )}
      </Manager>
      <Dropdown isOpen={isPreviewOptionsOpen} toggle={handleDropdownOpen}>
        <PreviewButtonToggle tag={PreviewButtonStyled} color="primary" outline={true}>
          <Icon
            icon={
              isPreviewOptionsOpen || isClassroomPreviewOpen ? 'arrow-drop-up' : 'arrow-drop-down'
            }
            size={24}
            className="icon"
          />
        </PreviewButtonToggle>
        <PreviewDropdownMenu>
          <PreviewDropdownItem onClick={handleClassRoomPreviewClick}>
            Classroom preview
          </PreviewDropdownItem>
        </PreviewDropdownMenu>
      </Dropdown>
      <form
        method="post"
        action={`${publicRuntimeConfig.PLAYER_URL}lesson/slide-answer-key`}
        ref={formRef}
        target="_blank"
      >
        <input type="hidden" name="data" value={dataSerialized} />
      </form>
    </React.Fragment>
  );
};

export default observer(ConnectedPreviewButton);
